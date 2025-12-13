-- Database Migration: Image Status Tracking
-- This migration adds columns to track image upload status and metadata

-- Add image tracking columns to plants table
ALTER TABLE plants 
ADD COLUMN IF NOT EXISTS image_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS image_size_kb INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_uploaded_at TIMESTAMP DEFAULT NULL;

-- Add image tracking columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS image_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS image_size_kb INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_uploaded_at TIMESTAMP DEFAULT NULL;

-- Create indices for faster queries
CREATE INDEX IF NOT EXISTS idx_plants_image_status ON plants(image_status);
CREATE INDEX IF NOT EXISTS idx_posts_image_status ON posts(image_status);
CREATE INDEX IF NOT EXISTS idx_plants_image_url ON plants(image_url);
CREATE INDEX IF NOT EXISTS idx_posts_image_url ON posts(image_url);

-- View to get images needing migration
CREATE OR REPLACE VIEW images_needing_migration AS
SELECT 
  'plants' as table_name,
  id,
  image_url,
  image_status,
  created_at
FROM plants
WHERE image_status != 'supabase' AND image_url IS NOT NULL
UNION ALL
SELECT 
  'posts' as table_name,
  id,
  image_url,
  image_status,
  created_at
FROM posts
WHERE image_status != 'supabase' AND image_url IS NOT NULL
ORDER BY created_at DESC;

-- Summary statistics
CREATE OR REPLACE VIEW image_migration_stats AS
SELECT
  'plants' as table_name,
  COUNT(*) as total_images,
  SUM(CASE WHEN image_status = 'supabase' THEN 1 ELSE 0 END) as migrated,
  SUM(CASE WHEN image_status != 'supabase' THEN 1 ELSE 0 END) as pending,
  ROUND(100.0 * SUM(CASE WHEN image_status = 'supabase' THEN 1 ELSE 0 END) / COUNT(*), 2) as migration_percent
FROM plants
WHERE image_url IS NOT NULL
UNION ALL
SELECT
  'posts' as table_name,
  COUNT(*) as total_images,
  SUM(CASE WHEN image_status = 'supabase' THEN 1 ELSE 0 END) as migrated,
  SUM(CASE WHEN image_status != 'supabase' THEN 1 ELSE 0 END) as pending,
  ROUND(100.0 * SUM(CASE WHEN image_status = 'supabase' THEN 1 ELSE 0 END) / COUNT(*), 2) as migration_percent
FROM posts
WHERE image_url IS NOT NULL;

-- COMMENT: Run this migration via Supabase SQL Editor
-- It adds image metadata tracking and creates views for monitoring migration progress
