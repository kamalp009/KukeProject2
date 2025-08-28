"""

This script reads data from an Excel (.xlsx) file and inserts it into a SQL database table.
The script supports both SQLite and PostgreSQL databases.

Requirements:
- pandas
- openpyxl
- sqlite3 (built-in)
Usage:
    python xlsx_to_sql.py

"""

import pandas as pd
import sqlite3
import os
import logging
from datetime import datetime
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('xlsx_import.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class XLSXToSQLImporter:
    """Class to handle XLSX to SQL database import operations."""
    
    def __init__(self, db_path: str = "records_database.db"):
        """
        Initialize the importer with database connection.
        
        Args:
            db_path (str): Path to SQLite database file
        """
        self.db_path = db_path
        self.connection = None
        
    def connect_database(self) -> bool:
        """
        Establish connection to SQLite database.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            self.connection = sqlite3.connect(self.db_path)
            logger.info(f"Successfully connected to database: {self.db_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to database: {str(e)}")
            return False
    
    def close_connection(self):
        """Close database connection."""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def validate_xlsx_file(self, file_path: str) -> bool:
        """
        Validate if XLSX file exists and is readable.
        
        Args:
            file_path (str): Path to XLSX file
            
        Returns:
            bool: True if file is valid, False otherwise
        """
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return False
        
        if not file_path.lower().endswith(('.xlsx', '.xls')):
            logger.error(f"Invalid file format. Expected .xlsx or .xls: {file_path}")
            return False
        
        try:
            # Try to read first few rows to validate
            pd.read_excel(file_path, nrows=1)
            logger.info(f"XLSX file validated: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to read XLSX file: {str(e)}")
            return False
    
    def read_xlsx_data(self, file_path: str, sheet_name: Optional[str] = None) -> Optional[pd.DataFrame]:
        """
        Read data from XLSX file.
        
        Args:
            file_path (str): Path to XLSX file
            sheet_name (str, optional): Name of sheet to read. If None, reads first sheet.
            
        Returns:
            pd.DataFrame or None: DataFrame containing the data, or None if failed
        """
        try:
            # Read the Excel file
            if sheet_name:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
            else:
                df = pd.read_excel(file_path)
            
            logger.info(f"Successfully read {len(df)} rows from XLSX file")
            logger.info(f"Columns found: {list(df.columns)}")
            
            return df
        except Exception as e:
            logger.error(f"Failed to read XLSX data: {str(e)}")
            return None
    
    def validate_columns(self, df: pd.DataFrame) -> bool:
        """
        Validate that required columns exist in the DataFrame.
        
        Args:
            df (pd.DataFrame): DataFrame to validate
            
        Returns:
            bool: True if all required columns exist, False otherwise
        """
        required_columns = ['number', 'short_description', 'resolution']
        
        # Convert column names to lowercase for case-insensitive comparison
        df_columns_lower = [col.lower().strip() for col in df.columns]
        
        missing_columns = []
        for col in required_columns:
            if col not in df_columns_lower:
                missing_columns.append(col)
        
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            logger.info(f"Available columns: {list(df.columns)}")
            return False
        
        logger.info("All required columns found")
        return True
    
    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare and clean data for insertion.
        
        Args:
            df (pd.DataFrame): Raw DataFrame
            
        Returns:
            pd.DataFrame: Cleaned DataFrame
        """
        # Normalize column names to lowercase
        df.columns = [col.lower().strip() for col in df.columns]
        
        # Handle missing values
        df['number'] = df['number'].fillna('').astype(str)
        df['short_description'] = df['short_description'].fillna('').astype(str)
        df['resolution'] = df['resolution'].fillna('').astype(str)
        
        # Remove completely empty rows
        df = df.dropna(how='all')
        
        # Remove rows where 'number' is empty (as it's required)
        df = df[df['number'].str.strip() != '']
        
        logger.info(f"Data prepared: {len(df)} valid rows")
        return df
    
    def insert_data(self, df: pd.DataFrame) -> bool:
        """
        Insert data into the database table.
        
        Args:
            df (pd.DataFrame): DataFrame containing the data to insert
            
        Returns:
            bool: True if insertion successful, False otherwise
        """
        try:
            cursor = self.connection.cursor()
            
            # Prepare insert query
            insert_query = """
            INSERT INTO records_table (number, short_description, resolution)
            VALUES (?, ?, ?)
            """
            
            # Convert DataFrame to list of tuples
            data_tuples = [
                (row['number'], row['short_description'], row['resolution'])
                for _, row in df.iterrows()
            ]
            
            # Execute batch insert
            cursor.executemany(insert_query, data_tuples)
            self.connection.commit()
            
            rows_inserted = cursor.rowcount
            logger.info(f"Successfully inserted {rows_inserted} rows into database")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to insert data: {str(e)}")
            if self.connection:
                self.connection.rollback()
            return False
    
    def get_table_count(self) -> int:
        """
        Get total number of records in the table.
        
        Returns:
            int: Number of records in table
        """
        try:
            cursor = self.connection.cursor()
            cursor.execute("SELECT COUNT(*) FROM records_table")
            count = cursor.fetchone()[0]
            return count
        except Exception as e:
            logger.error(f"Failed to get table count: {str(e)}")
            return 0
    
    def import_xlsx_to_sql(self, xlsx_file_path: str, sheet_name: Optional[str] = None) -> bool:
        """
        Main method to import XLSX data to SQL database.
        
        Args:
            xlsx_file_path (str): Path to XLSX file
            sheet_name (str, optional): Sheet name to read from
            
        Returns:
            bool: True if import successful, False otherwise
        """
        logger.info("=== Starting XLSX to SQL Import ===")
        
        # Validate XLSX file
        if not self.validate_xlsx_file(xlsx_file_path):
            return False
        
        # Connect to database
        if not self.connect_database():
            return False
        
        try:
            # Read XLSX data
            df = self.read_xlsx_data(xlsx_file_path, sheet_name)
            if df is None or df.empty:
                logger.error("No data found in XLSX file")
                return False
            
            # Validate columns
            if not self.validate_columns(df):
                return False
            
            # Prepare data
            df_cleaned = self.prepare_data(df)
            if df_cleaned.empty:
                logger.error("No valid data rows found after cleaning")
                return False
            
            # Get initial count
            initial_count = self.get_table_count()
            
            # Insert data
            if not self.insert_data(df_cleaned):
                return False
            
            # Get final count
            final_count = self.get_table_count()
            
            logger.info(f"Import completed successfully!")
            logger.info(f"Records before import: {initial_count}")
            logger.info(f"Records after import: {final_count}")
            logger.info(f"New records added: {final_count - initial_count}")
            
            return True
            
        except Exception as e:
            logger.error(f"Unexpected error during import: {str(e)}")
            return False
        
        finally:
            self.close_connection()


def main():
    """Main function to run the import process."""
    
    # Configuration
    XLSX_FILE_PATH = "data.xlsx"  # Change this to your XLSX file path
    SHEET_NAME = None  # Set to specific sheet name if needed, or None for first sheet
    DATABASE_PATH = "records_database.db"  # SQLite database file path
    
    # Create importer instance
    importer = XLSXToSQLImporter(DATABASE_PATH)
    
    # Run import
    success = importer.import_xlsx_to_sql(XLSX_FILE_PATH, SHEET_NAME)
    
    if success:
        print("Data import completed successfully!")
    else:
        print("Data import failed. Check logs for details.")


if __name__ == "__main__":
    main()