### Software Requirements

1. **Database System**: SQLite (default) or PostgreSQL
2. **Python**: Version 3.7 or higher
3. **Python Libraries**:
   - `pandas` - Data manipulation and analysis
   - `openpyxl` - Excel file reading
   - `sqlite3` - Database connectivity (built-in)
   - `logging` - Error and information logging (built-in)



### Step 1: Database Setup

1. **Run the SQL Script**:
   ```bash
   # For SQLite
   sqlite3 records_database.db < create_table.sql

2. **Verify Table Creation**:
   ```sql
   SELECT name FROM sqlite_master WHERE type='table' AND name='records_table';

#### File Format Notes:

- File extension: `.xlsx` or `.xls`
- Column names are case-insensitive

### Step 3: Configure Python Script

Edit the configuration section in `xlsx_to_sql.py`:

```python
# Configuration
XLSX_FILE_PATH = "data.xlsx"  # Your Excel file path
SHEET_NAME = None             # Sheet name or None for first sheet
DATABASE_PATH = "records_database.db"  # Database file path
```

### Running the Import Script

1. **Basic Usage**:
   ```bash
   python xlsx_to_sql.py
   ```

2. **Check Import Logs**:
   - Console output shows real-time progress
   - Detailed logs saved to `xlsx_import.log`