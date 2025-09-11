#!/usr/bin/env python3
import boto3
import sys
import json
from datetime import datetime, timezone, timedelta
import argparse
import re

def test_aws_permissions(bucket_name, region):
    """Test AWS permissions for S3 and EC2"""
    print("🔐 Testing AWS Permissions...")

    # Test S3 permissions
    try:
        s3_client = boto3.client('s3', region_name=region)
        # Test bucket access
        print(f"   ✓ Testing S3 bucket access: {bucket_name}")
        s3_client.head_bucket(Bucket=bucket_name)

        # Test list objects
        print("   ✓ Testing S3 list permissions...")
        response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=1)
        print("   ✅ S3 permissions OK")
    except Exception as e:
        print(f"   ❌ S3 permissions failed: {e}")
        return False

    # Test EC2 permissions (limited to 10 snapshots)
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        print("   ✓ Testing EC2 describe snapshots (limited to 10)...")
        ec2_client.describe_snapshots(OwnerIds=['self'], MaxResults=10)
        print("   ✅ EC2 permissions OK")
    except Exception as e:
        print(f"   ❌ EC2 permissions failed: {e}")
        return False

    return True

def test_folder_structure(bucket_name, region, backups_prefix='backups/', single_folder=True):
    """Test the Velero folder structure (single folder mode)"""
    print(f"📁 Testing Velero folder structure under: {backups_prefix}")

    try:
        s3_client = boto3.client('s3', region_name=region)

        # Check if backups folder exists
        print(f"   ✓ Checking for backups folder: s3://{bucket_name}/{backups_prefix}")
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=backups_prefix,
            Delimiter='/',
            MaxKeys=1 if single_folder else 10  # Only get one folder
        )

        if 'CommonPrefixes' not in response:
            print(f"   ⚠️  No backup folders found under {backups_prefix}")
            print("   This might not be the correct Velero backup bucket")
            return False, None

        backup_folders = []
        for prefix_info in response['CommonPrefixes']:
            folder_path = prefix_info['Prefix']
            folder_name = folder_path.rstrip('/').split('/')[-1]
            backup_folders.append((folder_name, folder_path))

        if single_folder:
            print(f"   ✅ Found target folder: {backup_folders[0][0]}")
            return True, backup_folders[0]  # Return the single folder info
        else:
            print(f"   ✅ Found {len(backup_folders)} backup folders")
            return True, backup_folders

    except Exception as e:
        print(f"   ❌ Failed to check folder structure: {e}")
        return False, None

def test_backup_folder_contents(bucket_name, region, target_folder_path):
    """Test contents of the target backup folder"""
    print("📄 Testing backup folder contents...")

    try:
        s3_client = boto3.client('s3', region_name=region)

        test_folder_name = target_folder_path.rstrip('/').split('/')[-1]
        print(f"   ✓ Examining folder: {test_folder_name}")

        # List files in the target folder
        folder_response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=target_folder_path,
            MaxKeys=20
        )

        if 'Contents' not in folder_response:
            print(f"   ⚠️  No files found in folder: {target_folder_path}")
            return False, []

        files = folder_response['Contents']
        file_types = {}
        csi_files = []

        for obj in files:
            key = obj['Key']
            if key.endswith('/'):
                continue  # Skip the folder itself

            filename = key.split('/')[-1]
            if 'csi-volumesnapshotcontents.json.gz' in filename:
                csi_files.append(filename)
                file_types['csi_snapshots'] = file_types.get('csi_snapshots', 0) + 1
            elif 'backup.json.gz' in filename:
                file_types['backup_metadata'] = file_types.get('backup_metadata', 0) + 1
            elif 'restore.json.gz' in filename:
                file_types['restore_metadata'] = file_types.get('restore_metadata', 0) + 1
            else:
                file_types['other'] = file_types.get('other', 0) + 1

        print(f"   ✅ Found {len(files)} files in target folder")
        print("   File types:")
        for file_type, count in file_types.items():
            print(f"     - {file_type}: {count} files")

        if csi_files:
            print(f"   ✅ Found CSI snapshot files: {csi_files[:3]}")
            if len(csi_files) > 3:
                print(f"     ... and {len(csi_files) - 3} more")
        else:
            print("   ⚠️  No CSI snapshot files found")
            print("   The cleanup script may not find snapshots to delete")

        return True, csi_files

    except Exception as e:
        print(f"   ❌ Failed to examine folder contents: {e}")
        return False, []

def extract_snapshot_ids_from_csi_file(bucket_name, region, csi_file_key, max_snapshots=10):
    """Extract snapshot IDs from CSI file (limited to max_snapshots)"""
    print(f"🔍 Extracting snapshot IDs from: {csi_file_key.split('/')[-1]}")

    try:
        s3_client = boto3.client('s3', region_name=region)

        # Download and read the CSI file
        response = s3_client.get_object(Bucket=bucket_name, Key=csi_file_key)

        # Handle gzipped content
        import gzip
        content = response['Body'].read()
        if csi_file_key.endswith('.gz'):
            content = gzip.decompress(content)

        # Parse JSON content
        csi_data = json.loads(content.decode('utf-8'))

        snapshot_ids = []
        items = csi_data.get('items', [])

        for item in items[:max_snapshots]:  # Limit to max_snapshots
            spec = item.get('spec', {})
            source = spec.get('source', {})
            volume_snapshot_handle = source.get('volumeSnapshotHandle', '')

            if volume_snapshot_handle and volume_snapshot_handle.startswith('snap-'):
                snapshot_ids.append(volume_snapshot_handle)

        print(f"   ✅ Found {len(snapshot_ids)} snapshot IDs (limited to {max_snapshots})")
        for i, snap_id in enumerate(snapshot_ids, 1):
            print(f"     {i:2d}. {snap_id}")

        return True, snapshot_ids

    except Exception as e:
        print(f"   ❌ Failed to extract snapshot IDs: {e}")
        return False, []

def validate_snapshots_exist(region, snapshot_ids):
    """Validate that the snapshot IDs exist in EC2"""
    print(f"✅ Validating {len(snapshot_ids)} snapshot IDs in EC2...")

    try:
        ec2_client = boto3.client('ec2', region_name=region)

        if not snapshot_ids:
            print("   ⚠️  No snapshot IDs to validate")
            return True, []

        # Check snapshots in batches (EC2 API limit)
        valid_snapshots = []
        invalid_snapshots = []

        batch_size = 10
        for i in range(0, len(snapshot_ids), batch_size):
            batch = snapshot_ids[i:i+batch_size]

            try:
                response = ec2_client.describe_snapshots(SnapshotIds=batch)
                found_snapshots = [snap['SnapshotId'] for snap in response['Snapshots']]
                valid_snapshots.extend(found_snapshots)

                # Find any missing snapshots in this batch
                missing = set(batch) - set(found_snapshots)
                invalid_snapshots.extend(missing)

            except Exception as e:
                print(f"   ⚠️  Error validating batch {batch}: {e}")
                invalid_snapshots.extend(batch)

        print(f"   ✅ Valid snapshots: {len(valid_snapshots)}")
        print(f"   ❌ Invalid snapshots: {len(invalid_snapshots)}")

        if invalid_snapshots:
            print("   Invalid snapshot IDs:")
            for snap_id in invalid_snapshots:
                print(f"     - {snap_id}")

        return len(invalid_snapshots) == 0, valid_snapshots

    except Exception as e:
        print(f"   ❌ Failed to validate snapshots: {e}")
        return False, []

def simulate_single_folder_cleanup(bucket_name, region, target_folder_path, max_snapshots=10):
    """Simulate cleanup for a single folder with snapshot limit"""
    print(f"🧪 Simulating cleanup for single folder (max {max_snapshots} snapshots)...")

    folder_name = target_folder_path.rstrip('/').split('/')[-1]

    # Extract date from folder name - using raw string for regex
    date_pattern = r'backup-(\d{14})$'
    match = re.search(date_pattern, folder_name)

    if not match:
        print(f"   ⚠️  Could not parse date from folder: {folder_name}")
        return False

    date_str = match.group(1)
    try:
        parsed_date = datetime.strptime(date_str, '%Y%m%d%H%M%S')
        folder_date = parsed_date.replace(tzinfo=timezone.utc)
        age_days = (datetime.now(timezone.utc) - folder_date).days

        print(f"   📋 Target folder: {folder_name}")
        print(f"   📅 Folder date: {folder_date.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"   ⏰ Age: {age_days} days")

        cutoff_date = datetime.now(timezone.utc) - timedelta(days=2)
        if folder_date < cutoff_date:
            print(f"   ✅ Folder is older than 2 days - would be processed for cleanup")
            return True
        else:
            print(f"   ⚠️  Folder is newer than 2 days - would be skipped")
            return False

    except ValueError as e:
        print(f"   ❌ Date parsing failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Test Velero cleanup environment - Single Folder & Limited Snapshots')
    parser.add_argument('--bucket', required=True, help='S3 bucket name (e.g., velero-eks-backup-us-dev)')
    parser.add_argument('--region', default='us-west-2', help='AWS region')
    parser.add_argument('--prefix', default='backups/', help='Backups folder prefix')
    parser.add_argument('--max-snapshots', type=int, default=10, help='Maximum number of snapshots to process')

    args = parser.parse_args()

    print("🧪 VELERO CLEANUP ENVIRONMENT TEST - SINGLE FOLDER & LIMITED SNAPSHOTS")
    print("=" * 70)
    print(f"Bucket: {args.bucket}")
    print(f"Region: {args.region}")
    print(f"Prefix: {args.prefix}")
    print(f"Max Snapshots: {args.max_snapshots}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Test 1: AWS Permissions
    print("Running: AWS Permissions")
    if not test_aws_permissions(args.bucket, args.region):
        print("❌ Environment has issues - please fix before running cleanup")
        sys.exit(1)
    print()

    # Test 2: Get Single Folder
    print("Running: Single Folder Structure")
    folder_success, target_folder = test_folder_structure(args.bucket, args.region, args.prefix, single_folder=True)
    if not folder_success or not target_folder:
        print("❌ Environment has issues - please fix before running cleanup")
        sys.exit(1)
    print()

    folder_name, folder_path = target_folder

    # Test 3: Folder Contents
    print("Running: Folder Contents")
    content_success, csi_files = test_backup_folder_contents(args.bucket, args.region, folder_path)
    if not content_success:
        print("❌ Environment has issues - please fix before running cleanup")
        sys.exit(1)
    print()

    # Test 4: Extract Snapshot IDs (limited)
    snapshot_ids = []
    if csi_files:
        print("Running: Snapshot ID Extraction")
        csi_file_key = folder_path + csi_files[0]  # Use first CSI file
        extract_success, snapshot_ids = extract_snapshot_ids_from_csi_file(
            args.bucket, args.region, csi_file_key, args.max_snapshots
        )
        if not extract_success:
            print("❌ Failed to extract snapshot IDs")
            sys.exit(1)
        print()

    # Test 5: Validate Snapshots
    if snapshot_ids:
        print("Running: Snapshot Validation")
        validate_success, valid_snapshots = validate_snapshots_exist(args.region, snapshot_ids)
        if not validate_success:
            print("⚠️  Some snapshots are invalid, but continuing...")
        print()

    # Test 6: Simulate Cleanup
    print("Running: Cleanup Simulation")
    cleanup_success = simulate_single_folder_cleanup(args.bucket, args.region, folder_path, args.max_snapshots)
    print()

    # Summary
    print("=" * 70)
    print("🎯 TEST RESULTS SUMMARY:")
    print(f"✅ Target folder: {folder_name}")
    print(f"✅ Snapshot limit: {args.max_snapshots}")
    print(f"✅ Found snapshots: {len(snapshot_ids)}")

    if cleanup_success:
        print("✅ Single folder cleanup simulation successful!")
        print(f"\nNext steps:")
        print(f"1. Dry run: python velero_cleanup_single.py --bucket {args.bucket} --region {args.region} --folder-path {folder_path} --max-snapshots {args.max_snapshots} --dry-run")
        print(f"2. Execute: python velero_cleanup_single.py --bucket {args.bucket} --region {args.region} --folder-path {folder_path} --max-snapshots {args.max_snapshots} --execute")
        sys.exit(0)
    else:
        print("❌ Environment has issues - please review before running cleanup")
        sys.exit(1)

if __name__ == "__main__":
    main()
