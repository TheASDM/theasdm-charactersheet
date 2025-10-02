-- Clean user-generated data while keeping D&D content
-- Run with: psql -U dnd_user -d dnd_character_sheet -f scripts/clean-user-data.sql

-- Remove all user-generated data
TRUNCATE TABLE character_version_history CASCADE;
TRUNCATE TABLE characters CASCADE;
TRUNCATE TABLE campaigns CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE characters_id_seq RESTART WITH 1;
ALTER SEQUENCE campaigns_id_seq RESTART WITH 1;
ALTER SEQUENCE character_version_history_id_seq RESTART WITH 1;

-- Verify cleanup
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Characters', COUNT(*) FROM characters
UNION ALL
SELECT 'Campaigns', COUNT(*) FROM campaigns;

-- Your D&D content (spells, classes, etc.) remains intact
SELECT 'Spells' as table_name, COUNT(*) as count FROM spells
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes
UNION ALL
SELECT 'Species', COUNT(*) FROM species
UNION ALL
SELECT 'Backgrounds', COUNT(*) FROM backgrounds
UNION ALL
SELECT 'Feats', COUNT(*) FROM feats
UNION ALL
SELECT 'Items', COUNT(*) FROM items;
