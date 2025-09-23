-- Database initialization script for D&D Character Sheet Generator
-- This script creates the database and initial setup

-- Create database (run this manually as superuser)
-- CREATE DATABASE dnd_character_sheet;
-- CREATE USER dnd_user WITH ENCRYPTED PASSWORD 'password';
-- GRANT ALL PRIVILEGES ON DATABASE dnd_character_sheet TO dnd_user;

-- Connect to the database before running the rest
\c dnd_character_sheet;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create initial content version
INSERT INTO content_versions (version, release_date, description, breaking_changes)
VALUES ('1.0.0', NOW(), 'Initial D&D 2024 content with basic rules', false)
ON CONFLICT (version) DO NOTHING;

-- Create logs directory and basic logging table for application logs
CREATE TABLE IF NOT EXISTS app_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    meta JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_campaign_id ON characters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_spells_level ON spells(level);
CREATE INDEX IF NOT EXISTS idx_spells_school ON spells(school);
CREATE INDEX IF NOT EXISTS idx_spells_classes ON spells USING gin(classes);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_spells_search ON spells USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_items_search ON items USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

COMMENT ON DATABASE dnd_character_sheet IS 'D&D 2024 Character Sheet Generator with Nimble TTRPG homebrew mechanics';