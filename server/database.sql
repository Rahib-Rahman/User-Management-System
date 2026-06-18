-- Clean and correct schema
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'unverified',
    previous_status VARCHAR(20)
);

-- Backfill (safe to run)
UPDATE users
SET previous_status = status
WHERE previous_status IS NULL;

-- Verify columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users';