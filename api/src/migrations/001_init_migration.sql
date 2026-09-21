-- Migration: 001_init_migration.sql
-- Creating initial tables for the dashboard application with indexes and triggers for updating the columns

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ######################## 
-- Tables
-- ######################## 

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE TrafficSource AS ENUM ('organic', 'paid', 'referral', 'social', 'direct');

CREATE TABLE IF NOT EXISTS user_visits_stats(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_click BOOLEAN NOT NULL,
    whatsapp_click BOOLEAN NOT NULL,
    phone_click BOOLEAN NOT NULL,
    time_on_page INTEGER NOT NULL,
    device_type TEXT NOT NULL,
    traffic_source TrafficSource NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ######################## 
-- Comments
-- ######################## 

COMMENT ON TABLE users IS 'Table to store dashboard users information';
COMMENT ON TABLE refresh_tokens IS 'Table to store refresh tokens for user sessions';
COMMENT ON TABLE password_reset_tokens IS 'Table to store password reset tokens for users';
COMMENT ON TABLE user_visits_stats IS 'Table to store user visits statistics';

-- ######################## 
-- Update funcion for updated_at column 
-- ######################## 

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refresh_tokens_updated_at
BEFORE UPDATE ON refresh_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_password_reset_tokens_updated_at
BEFORE UPDATE ON password_reset_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ######################## 
-- Indexes
-- ######################## 

CREATE INDEX idx_device_type ON user_visits_stats(device_type);

CREATE INDEX idx_traffic_source ON user_visits_stats(traffic_source);

CREATE INDEX idx_location ON user_visits_stats(location);

COMMIT;