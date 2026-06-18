CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL, 
    password VARCHAR(255) NOT NULL,    
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- sort by login
    registration_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    status VARCHAR(20) DEFAULT 'unconfirmed' -- status: unconfirmed, active, blocked
);

-- Add this line after the status column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS previous_status VARCHAR(20);

-- Optional: Backfill existing users (set previous_status = status for current records)
UPDATE users SET previous_status = status WHERE previous_status IS NULL;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'unverified',
    previous_status VARCHAR(20)          -- NEW COLUMN for Requirement #2
);

-- Backfill existing users (safe to run multiple times)
UPDATE users
SET previous_status = status
WHERE previous_status IS NULL;