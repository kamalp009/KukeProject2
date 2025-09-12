#!/usr/bin/env python3

import boto3
import json
import gzip
import os
import io
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
import argparse
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('velero_cleanup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class VeleroCleanup:
    def __init__(self, bucket_name, region='us-east-1', dry_run=True):
        self.bucket_name = bucket_name
        self.region = region
        self.dry_run = dry_run
        self.s3_client = boto3.client('s3', region_name=region)
        self.ec2_client = boto3.client('ec2', region_name=region)

        # Calculate retention dates
        self.today = datetime.now().date()
        self.yesterday = self.today - timedelta(days=1)
        self.cutoff_date = self.today - timedelta(days=2)  # Keep today and yesterday

        logger.info(f"Initialized VeleroCleanup - Bucket: {bucket_name}, Region: {region}")
        logger.info(f"Retention: Keep backups from {self.yesterday} and {self.today}")
        logger.info(f"Delete backups older than: {self.cutoff_date}")

    def list_backup_folders(self):
        """List all backup folders in S3 bucket"""
        try:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(
                Bucket=self.bucket_name,
                Prefix='backups/',
                Delimiter='/'
            )

            backup_folders = []
            for page in page_iterator:
                if 'CommonPrefixes' in page:
                    for prefix in page['CommonPrefixes']:
                        folder_name = prefix['Prefix'].split('/')[-2]  # Remove 'backups/' and trailing '/'
                        backup_folders.append(folder_name)

            logger.info(f"Found {len(backup_folders)} backup folders")
            return backup_folders
        except Exception as e:
            logger.error(f"Error listing backup folders: {e}")
            return []

    def parse_backup_date(self, backup_folder_name):
        """Extract date from backup folder name like 'us-dev-backup-20250531153449'"""
        try:
            # Extract timestamp part (assumes format: prefix-YYYYMMDDHHMMSS)
            timestamp_str = backup_folder_name.split('-')[-1]
            if len(timestamp_str) >= 8:
                date_str = timestamp_str[:8]  # YYYYMMDD
                return datetime.strptime(date_str, '%Y%m%d').date()
        except Exception as e:
            logger.warning(f"Could not parse date from folder name {backup_folder_name}: {e}")
        return None

    def get_old_backup_folders(self, backup_folders):
        """Identify backup folders older than retention period"""
        old_folders = []
        for folder in backup_folders:
            folder_date = self.parse_backup_date(folder)
            if folder_date and folder_date < self.cutoff_date:
                old_folders.append({
                    'name': folder,
                    'date': folder_date,
                    'age_days': (self.today - folder_date).days
                })

        # Sort by age (oldest first)
        old_folders.sort(key=lambda x: x['date'])
        logger.info(f"Found {len(old_folders)} old backup folders to process")
        return old_folders

    def download_and_parse_snapshot_file(self, backup_folder):
        """Download and parse the CSI volumesnapshotcontents file"""
        snapshot_file_key = f"backups/{backup_folder}/{backup_folder}-csi-volumesnapshotcontents.json.gz"

        try:
            logger.info(f"Downloading snapshot file: {snapshot_file_key}")
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=snapshot_file_key)

            # Decompress gzip content
            with gzip.GzipFile(fileobj=io.BytesIO(response['Body'].read())) as gz_file:
                json_content = gz_file.read().decode('utf-8')

            # Parse JSON and extract snapshot IDs
            data = json.loads(json_content)
            snapshot_ids = []

            for item in data:
                if isinstance(item, dict) and 'status' in item and 'snapshotHandle' in item['status']:
                    snapshot_id = item['status']['snapshotHandle']
                    if snapshot_id.startswith('snap-'):
                        snapshot_ids.append(snapshot_id)

            logger.info(f"Extracted {len(snapshot_ids)} snapshot IDs from {backup_folder}")
            return snapshot_ids

        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                logger.warning(f"Snapshot file not found: {snapshot_file_key}")
            else:
                logger.error(f"Error downloading snapshot file: {e}")
            return []
        except Exception as e:
            logger.error(f"Error parsing snapshot file {snapshot_file_key}: {e}")
            return []

    def delete_ebs_snapshots(self, snapshot_ids, limit=None):
        """Delete EBS snapshots"""
        if limit:
            snapshot_ids = snapshot_ids[:limit]

        deleted_count = 0
        failed_count = 0

        for snapshot_id in snapshot_ids:
            try:
                if self.dry_run:
                    logger.info(f"DRY RUN: Would delete snapshot {snapshot_id}")
                else:
                    logger.info(f"Deleting snapshot: {snapshot_id}")
                    self.ec2_client.delete_snapshot(SnapshotId=snapshot_id)
                deleted_count += 1
            except ClientError as e:
                error_code = e.response['Error']['Code']
                if error_code == 'InvalidSnapshot.NotFound':
                    logger.warning(f"Snapshot {snapshot_id} not found (already deleted?)")
                elif error_code == 'InvalidSnapshot.InUse':
                    logger.warning(f"Snapshot {snapshot_id} is in use, skipping")
                else:
                    logger.error(f"Failed to delete snapshot {snapshot_id}: {e}")
                failed_count += 1
            except Exception as e:
                logger.error(f"Unexpected error deleting snapshot {snapshot_id}: {e}")
                failed_count += 1

        logger.info(f"Snapshot deletion summary - Processed: {deleted_count}, Failed: {failed_count}")
        return deleted_count, failed_count

    def delete_s3_backup_folder(self, backup_folder):
        """Delete all objects in a backup folder"""
        prefix = f"backups/{backup_folder}/"

        try:
            # List all objects in the folder
            paginator = self.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(Bucket=self.bucket_name, Prefix=prefix)

            objects_to_delete = []
            for page in page_iterator:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        objects_to_delete.append({'Key': obj['Key']})

            if objects_to_delete:
                if self.dry_run:
                    logger.info(f"DRY RUN: Would delete {len(objects_to_delete)} objects from {backup_folder}")
                else:
                    # Delete objects in batches (max 1000 per batch)
                    batch_size = 1000
                    for i in range(0, len(objects_to_delete), batch_size):
                        batch = objects_to_delete[i:i + batch_size]
                        response = self.s3_client.delete_objects(
                            Bucket=self.bucket_name,
                            Delete={'Objects': batch}
                        )
                        logger.info(f"Deleted batch of {len(batch)} objects from {backup_folder}")

                logger.info(f"Backup folder {backup_folder} cleanup completed ({len(objects_to_delete)} objects)")
            else:
                logger.info(f"No objects found in backup folder {backup_folder}")

        except Exception as e:
            logger.error(f"Error deleting S3 backup folder {backup_folder}: {e}")

    def cleanup_old_backups(self, test_limit=None):
        """Main cleanup function"""
        logger.info("Starting Velero backup cleanup...")

        # Get all backup folders
        backup_folders = self.list_backup_folders()
        if not backup_folders:
            logger.info("No backup folders found")
            return

        # Identify old folders
        old_folders = self.get_old_backup_folders(backup_folders)
        if not old_folders:
            logger.info("No old backup folders found for cleanup")
            return

        # Apply test limit if specified
        if test_limit:
            old_folders = old_folders[:test_limit]
            logger.info(f"Limited to {test_limit} folders for testing")

        total_snapshots_processed = 0
        total_folders_processed = 0

        for folder_info in old_folders:
            folder_name = folder_info['name']
            folder_date = folder_info['date']
            age_days = folder_info['age_days']

            logger.info(f"Processing backup folder: {folder_name} (Date: {folder_date}, Age: {age_days} days)")

            # Extract and delete snapshots
            snapshot_ids = self.download_and_parse_snapshot_file(folder_name)
            if snapshot_ids:
                deleted_count, failed_count = self.delete_ebs_snapshots(snapshot_ids)
                total_snapshots_processed += deleted_count

            # Delete S3 backup folder
            self.delete_s3_backup_folder(folder_name)
            total_folders_processed += 1

            logger.info(f"Completed processing folder: {folder_name}")

        logger.info(f"Cleanup completed - Folders processed: {total_folders_processed}, Snapshots processed: {total_snapshots_processed}")


def main():
    parser = argparse.ArgumentParser(description='Velero Backup Cleanup Script')
    parser.add_argument('--bucket', required=True, help='S3 bucket name containing Velero backups')
    parser.add_argument('--region', default='us-east-1', help='AWS region (default: us-east-1)')
    parser.add_argument('--dry-run', action='store_true', help='Perform a dry run without actually deleting anything')
    parser.add_argument('--test-limit', type=int, help='Limit the number of old folders to process (for testing)')

    args = parser.parse_args()

    # Initialize cleanup utility
    cleanup = VeleroCleanup(
        bucket_name=args.bucket,
        region=args.region,
        dry_run=args.dry_run
    )

    # Perform cleanup
    cleanup.cleanup_old_backups(test_limit=args.test_limit)

if __name__ == "__main__":
    main()
