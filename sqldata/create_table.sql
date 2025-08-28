
-- DROP TABLE IF EXISTS records_table;

-- Create the records table
CREATE TABLE records_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Primary key (auto-increment)
    number VARCHAR(100) NOT NULL,          -- Combination of text and number
    short_description TEXT NOT NULL,       -- Short description (any text)
    resolution TEXT,                       -- Resolution (any text, no size limit)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Auto timestamp for record creation
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- Auto timestamp for last update
);

-- Create indexes for better query performance
CREATE INDEX idx_number ON records_table(number);
CREATE INDEX idx_created_at ON records_table(created_at);
