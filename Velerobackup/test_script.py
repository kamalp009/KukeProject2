#!/usr/bin/env python3

import boto3
import sys
import json
from datetime import datetime, timezone
import argparse

def test_aws_permissions(bucket_name, region):


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

def test_velero_files(bucket_name, region):


    try:
        s3_client = boto3.client('s3', region_name=region)

        # Look for Velero files
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            MaxKeys=100
        )

        if 'Contents' not in response:
            print("   ⚠️  No files found in bucket")
            return False

        velero_files = []
        for obj in response['Contents']:
            key = obj['Key']
            if any(pattern in key for pattern in [
                'csi-volumesnapshotcontents.json.gz',
                'backup.json.gz',
                'volumesnapshots.json.gz'
            ]):
                velero_files.append({
                    'key': key,
                    'size': obj['Size'],
                    'modified': obj['LastModified']
                })

        if velero_files:
            print(f"   ✅ Found {len(velero_files)} Velero backup files")
            print("   Recent files:")
            for f in sorted(velero_files, key=lambda x: x['modified'], reverse=True)[:3]:
                size_mb = f['size'] / (1024*1024)
                print(f"     - {f['key']} ({size_mb:.1f}MB, {f['modified'].strftime('%Y-%m-%d %H:%M')})")
        else:
            print("   ⚠️  No Velero backup files found")
            print("   This might not be a Velero backup bucket")
            return False

        return True

    except Exception as e:
        print(f"   ❌ Failed to check Velero files: {e}")
        return False

def test_dry_run(bucket_name, region):


    try:
        from velero_cleanup import VeleroBackupCleanup

        cleanup = VeleroBackupCleanup(bucket_name, region)
        old_files = cleanup.list_old_backup_files()

        if old_files:
            print(f"   📋 Would process {len(old_files)} old files:")
            for f in old_files[:5]:  # Show first 5
                age = datetime.now(timezone.utc) - f['LastModified']
                print(f"     - {f['Key']} (age: {age.days} days)")
            if len(old_files) > 5:
                print(f"     ... and {len(old_files) - 5} more files")
        else:
            print("   ✅ No old files found - nothing to cleanup")

        return True

    except ImportError:
        print("   ⚠️  Cannot import velero_cleanup module")
        print("   Make sure velero_cleanup.py is in the same directory")
        return False
    except Exception as e:
        print(f"   ❌ Dry run simulation failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Test Velero cleanup environment')
    parser.add_argument('--bucket', required=True, help='S3 bucket name')
    parser.add_argument('--region', default='us-west-2', help='AWS region')

    args = parser.parse_args()

    print("🧪 VELERO CLEANUP ENVIRONMENT TEST")
    print("=" * 50)
    print(f"Bucket: {args.bucket}")
    print(f"Region: {args.region}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    tests = [
        ("AWS Permissions", lambda: test_aws_permissions(args.bucket, args.region)),
        ("Velero Files", lambda: test_velero_files(args.bucket, args.region)),
        ("Dry Run Simulation", lambda: test_dry_run(args.bucket, args.region))
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"Running: {test_name}")
        if test_func():
            passed += 1
        print()

    print("=" * 50)
    print(f"🎯 TEST RESULTS: {passed}/{total} passed")

    if passed == total:
        print("✅ Environment ready for Velero cleanup!")
        print("\nNext steps:")
        print(f"1. Dry run: python velero_cleanup.py --bucket {args.bucket} --region {args.region} --dry-run")
        print(f"2. Execute: python velero_cleanup.py --bucket {args.bucket} --region {args.region} --execute")
        sys.exit(0)
    else:
        print("❌ Environment has issues - please fix before running cleanup")
        sys.exit(1)

if __name__ == "__main__":
    main()
