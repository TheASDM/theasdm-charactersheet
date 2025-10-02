#!/bin/bash
# Export a clean database dump for Docker initialization

# First, clean user data
echo "Cleaning user-generated data..."
psql -U dnd_user -d dnd_character_sheet -f scripts/clean-user-data.sql

# Export the database schema and D&D content
echo "Exporting database..."
pg_dump -U dnd_user \
  -d dnd_character_sheet \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -f docker/postgres-init/01-schema-and-data.sql

echo "✅ Clean database exported to docker/postgres-init/01-schema-and-data.sql"
echo "This file will be used to initialize the PostgreSQL container"
