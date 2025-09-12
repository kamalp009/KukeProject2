#!/usr/bin/env python3

import boto3
import json
import gzip
import io
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_snapshot_extraction(bucket_name, region='us-east-1', limit=10):
    s3_client = boto3.client('s3', region_name=region)

    # Calculate dates
    today = datetime.now().date()
    cutoff_date = today - timedelta(days=2)

    logger.info(f"Testing snapshot extraction from bucket: {bucket_name}")
    logger.info(f"Looking for backups older than: {cutoff_date}")

    try:
        # List backup folders
        paginator = s3_client.get_paginator('list_objects_v2')
        page_iterator = paginator.paginate(
            Bucket=bucket_name,
            Prefix='backups/',
            Delimiter='/'
        )

        backup_folders = []
        for page in page_iterator:
            if 'CommonPrefixes' in page:
                for prefix in page['CommonPrefixes']:
                    folder_name = prefix['Prefix'].split('/')[-2]
                    backup_folders.append(folder_name)

        logger.info(f"Found {len(backup_folders)} backup folders")

        # Parse dates and find old folders
        old_folders = []
        for folder in backup_folders:
            try:
                timestamp_str = folder.split('-')[-1]
                if len(timestamp_str) >= 8:
                    date_str = timestamp_str[:8]
                    folder_date = datetime.strptime(date_str, '%Y%m%d').date()
                    if folder_date < cutoff_date:
                        age_days = (today - folder_date).days
                        old_folders.append({
                            'name': folder,
                            'date': folder_date,
                            'age_days': age_days
                        })
            except Exception as e:
                logger.warning(f"Could not parse date from {folder}: {e}")

        old_folders.sort(key=lambda x: x['date'])
        logger.info(f"Found {len(old_folders)} old backup folders")

        # Extract snapshots from old folders
        all_snapshots = []
        for folder_info in old_folders:
            folder_name = folder_info['name']
            snapshot_file_key = f"backups/{folder_name}/{folder_name}-csi-volumesnapshotcontents.json.gz"

            try:
                logger.info(f"Checking folder: {folder_name} (Age: {folder_info['age_days']} days)")
                response = s3_client.get_object(Bucket=bucket_name, Key=snapshot_file_key)

                # Decompress and parse
                with gzip.GzipFile(fileobj=io.BytesIO(response['Body'].read())) as gz_file:
                    json_content = gz_file.read().decode('utf-8')

                data = json.loads(json_content)
                folder_snapshots = []

                for item in data:
                    if isinstance(item, dict) and 'status' in item and 'snapshotHandle' in item['status']:
                        snapshot_id = item['status']['snapshotHandle']
                        if snapshot_id.startswith('snap-'):
                            folder_snapshots.append({
                                'id': snapshot_id,
                                'folder': folder_name,
                                'date': folder_info['date'],
                                'age_days': folder_info['age_days']
                            })

                logger.info(f"Found {len(folder_snapshots)} snapshots in {folder_name}")
                all_snapshots.extend(folder_snapshots)

                # Stop if we have enough for testing
                if len(all_snapshots) >= limit:
                    break

            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchKey':
                    logger.warning(f"Snapshot file not found: {snapshot_file_key}")
                else:
                    logger.error(f"Error accessing {snapshot_file_key}: {e}")
            except Exception as e:
                logger.error(f"Error processing {folder_name}: {e}")

        # Limit to test amount
        test_snapshots = all_snapshots[:limit]

        print(f"\n=== TEST RESULTS ===")
        print(f"Total old snapshots found: {len(all_snapshots)}")
        print(f"Test snapshots (limited to {limit}):")
        print("-" * 60)

        for i, snap in enumerate(test_snapshots, 1):
            print(f"{i:2d}. {snap['id']} | Folder: {snap['folder']} | Age: {snap['age_days']} days")

        print("-" * 60)
        print(f"\nTest deletion commands:")
        for snap in test_snapshots:
            print(f"aws ec2 delete-snapshot --snapshot-id {snap['id']}")

        return test_snapshots

    except Exception as e:
        logger.error(f"Error in test function: {e}")
        return []

if __name__ == "__main__":
    # Configuration
    BUCKET_NAME = "velero-eks-backup-us-dev"  # Replace with your bucket name
    REGION = "us-east-1"  # Replace with your region
    LIMIT = 10

    snapshots = test_snapshot_extraction(BUCKET_NAME, REGION, LIMIT)
    print(f"\nTest completed. Found {len(snapshots)} snapshots for testing.")
