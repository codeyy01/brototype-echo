-- Step 1: Convert category column to text temporarily
ALTER TABLE tickets ALTER COLUMN category TYPE text;

-- Step 2: Update existing data to new category values
UPDATE tickets 
SET category = CASE 
  WHEN category = 'academic' THEN 'academic_labs'
  WHEN category = 'infrastructure' THEN 'infrastructure_wifi'
  WHEN category = 'other' THEN 'other'
  ELSE category
END;

-- Step 3: Drop the old enum type
DROP TYPE ticket_category;

-- Step 4: Create new enum with all categories
CREATE TYPE ticket_category AS ENUM (
  'academic_labs',
  'infrastructure_wifi', 
  'hostel_mess',
  'sanitation_hygiene',
  'administrative',
  'other'
);

-- Step 5: Convert column back to enum type
ALTER TABLE tickets 
  ALTER COLUMN category TYPE ticket_category 
  USING category::ticket_category;