-- Optional database initialization script
-- This file will be executed when the Postgres container starts for the first time

-- Create extensions for better performance and monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if it doesn't exist (usually handled by environment variables)
-- This is just for documentation purposes

-- Set up basic monitoring views
CREATE OR REPLACE VIEW db_stats AS
SELECT
    schemaname,
    tablename,
    attname AS column_name,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, attname;

-- Create a function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
    table_name text,
    size_mb numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        concat_ws('.', schemaname, tablename)::text as table_name,
        pg_total_relation_size(concat_ws('.', schemaname, tablename)) / 1024.0 / 1024.0 as size_mb
    FROM pg_stat_user_tables
    ORDER BY size_mb DESC;
END;
$$ LANGUAGE plpgsql;

-- Basic configuration comments for future reference
-- These settings can be adjusted based on system resources
COMMENT ON DATABASE avatar_drop_system IS 'Single-user avatar and drop collection system with local file storage';
COMMENT ON EXTENSION pg_stat_statements IS 'Extension for tracking SQL statement statistics';
