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

    # Test EC2 permissions
    try:
        ec2_client = boto3.client('ec2', region_name=region)

        print("   ✓ Testing EC2 describe snapshots...")
        ec2_client.describe_snapshots(OwnerIds=['self'], MaxResults=1)

        print("   ✅ EC2 permissions OK")

    except Exception as e:
        print(f"   ❌ EC2 permissions failed: {e}")
        return False

    return True

def test_folder_structure(bucket_name, region, backups_prefix='backups/'):
    """Test the Velero folder structure"""

    print(f"📁 Testing Velero folder structure under: {backups_prefix}")

    try:
        s3_client = boto3.client('s3', region_name=region)

        # Check if backups folder exists
        print(f"   ✓ Checking for backups folder: s3://{bucket_name}/{backups_prefix}")

        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=backups_prefix,
            Delimiter='/',
            MaxKeys=10
        )

        if 'CommonPrefixes' not in response:
            print(f"   ⚠️  No backup folders found under {backups_prefix}")
            print("   This might not be the correct Velero backup bucket")
            return False

        backup_folders = []
        for prefix_info in response['CommonPrefixes']:
            folder_path = prefix_info['Prefix']
            folder_name = folder_path.rstrip('/').split('/')[-1]
            backup_folders.append((folder_name, folder_path))

        print(f"   ✅ Found {len(backup_folders)} backup folders")

        # Show recent backup folders
        print("   Recent backup folders:")
        for folder_name, folder_path in backup_folders[:5]:
            # Try to extract date from folder name
            date_pattern = r'backup-(\d{14})$'
            match = re.search(date_pattern, folder_name)
            if match:
                date_str = match.group(1)
                try:
                    parsed_date = datetime.strptime(date_str, '%Y%m%d%H%M%S')
                    age_days = (datetime.now() - parsed_date).days
                    print(f"     - {folder_name} (age: {age_days} days)")
                except:
                    print(f"     - {folder_name} (date parse failed)")
            else:
                print(f"     - {folder_name} (no date pattern)")

        if len(backup_folders) > 5:
            print(f"     ... and {len(backup_folders) - 5} more folders")

        return True

    except Exception as e:
        print(f"   ❌ Failed to check folder structure: {e}")
        return False

def test_backup_folder_contents(bucket_name, region, backups_prefix='backups/'):
    """Test contents of a backup folder"""

    print("📄 Testing backup folder contents...")

    try:
        s3_client = boto3.client('s3', region_name=region)

        # Get a backup folder to examine
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=backups_prefix,
            Delimiter='/',
            MaxKeys=1
        )

        if 'CommonPrefixes' not in response:
            print("   ⚠️  No backup folders found to examine")
            return False

        test_folder_path = response['CommonPrefixes'][0]['Prefix']
        test_folder_name = test_folder_path.rstrip('/').split('/')[-1]

        print(f"   ✓ Examining folder: {test_folder_name}")

        # List files in the test folder
        folder_response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=test_folder_path,
            MaxKeys=20
        )

        if 'Contents' not in folder_response:
            print(f"   ⚠️  No files found in folder: {test_folder_path}")
            return False

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

        print(f"   ✅ Found {len(files)} files in test folder")
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

        return True

    except Exception as e:
        print(f"   ❌ Failed to examine folder contents: {e}")
        return False

def simulate_cleanup_discovery(bucket_name, region, backups_prefix='backups/'):
    """Simulate what the cleanup script would discover"""

    print("🧪 Simulating cleanup discovery...")

    try:
        s3_client = boto3.client('s3', region_name=region)
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=2)

        # Get all backup folders
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=backups_prefix,
            Delimiter='/'
        )

        if 'CommonPrefixes' not in response:
            print("   ⚠️  No backup folders found")
            return False

        old_folders = []
        recent_folders = []

        for prefix_info in response['CommonPrefixes']:
            folder_path = prefix_info['Prefix']
            folder_name = folder_path.rstrip('/').split('/')[-1]

            # Try to extract date from folder name
            date_pattern = r'backup-(\d{14})$'
            match = re.search(date_pattern, folder_name)

            if match:
                date_str = match.group(1)
                try:
                    parsed_date = datetime.strptime(date_str, '%Y%m%d%H%M%S')
                    folder_date = parsed_date.replace(tzinfo=timezone.utc)

                    if folder_date < cutoff_date:
                        old_folders.append((folder_name, folder_date))
                    else:
                        recent_folders.append((folder_name, folder_date))

                except ValueError:
                    print(f"   ⚠️  Could not parse date from: {folder_name}")
            else:
                print(f"   ⚠️  No date pattern in folder: {folder_name}")

        print(f"   📋 Cleanup would process:")
        print(f"     - Old folders (>2 days): {len(old_folders)}")
        print(f"     - Recent folders (≤2 days): {len(recent_folders)}")

        if old_folders:
            print("   Old folders to be cleaned:")
            for folder_name, folder_date in sorted(old_folders, key=lambda x: x[1]):
                age_days = (datetime.now(timezone.utc) - folder_date).days
                print(f"     - {folder_name} (age: {age_days} days)")
        else:
            print("   ✅ No old folders found - nothing to cleanup")

        if recent_folders:
            print("   Recent folders to be kept:")
            for folder_name, folder_date in sorted(recent_folders, key=lambda x: x[1], reverse=True)[:3]:
                age_days = (datetime.now(timezone.utc) - folder_date).days
                print(f"     - {folder_name} (age: {age_days} days)")

        return True

    except Exception as e:
        print(f"   ❌ Failed to simulate cleanup discovery: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Test Velero cleanup environment - Folder Structure')
    parser.add_argument('--bucket', required=True, help='S3 bucket name (e.g., velero-eks-backup-us-dev)')
    parser.add_argument('--region', default='us-west-2', help='AWS region')
    parser.add_argument('--prefix', default='backups/', help='Backups folder prefix')

    args = parser.parse_args()

    print("🧪 VELERO CLEANUP ENVIRONMENT TEST - FOLDER STRUCTURE")
    print("=" * 60)
    print(f"Bucket: {args.bucket}")
    print(f"Region: {args.region}")
    print(f"Prefix: {args.prefix}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    tests = [
        ("AWS Permissions", lambda: test_aws_permissions(args.bucket, args.region)),
        ("Folder Structure", lambda: test_folder_structure(args.bucket, args.region, args.prefix)),
        ("Folder Contents", lambda: test_backup_folder_contents(args.bucket, args.region, args.prefix)),
        ("Cleanup Discovery", lambda: simulate_cleanup_discovery(args.bucket, args.region, args.prefix))
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"Running: {test_name}")
        if test_func():
            passed += 1
        print()

    print("=" * 60)
    print(f"🎯 TEST RESULTS: {passed}/{total} passed")

    if passed == total:
        print("✅ Environment ready for Velero cleanup!")
        print("\nNext steps:")
        print(f"1. Dry run: python velero_cleanup_folders.py --bucket {args.bucket} --region {args.region} --prefix {args.prefix} --dry-run")
        print(f"2. Execute: python velero_cleanup_folders.py --bucket {args.bucket} --region {args.region} --prefix {args.prefix} --execute")
        sys.exit(0)
    else:
        print("❌ Environment has issues - please fix before running cleanup")
        sys.exit(1)

if __name__ == "__main__":
    main()
