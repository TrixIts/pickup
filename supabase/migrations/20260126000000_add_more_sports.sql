-- Add new sports to the sports table
-- We attempt to insert them. If a unique constraint exists on name, we skip.
-- Otherwise we might create duplicates if run multiple times without constraint, but usually reference tables have unique names.

INSERT INTO public.sports (name)
VALUES
  ('Hockey'),
  ('Lacrosse'),
  ('Pickleball'),
  ('Ultimate Frisbee'),
  ('Football'),
  ('Baseball'),
  ('Softball'),
  ('Rugby'),
  ('Badminton'),
  ('Table Tennis')
ON CONFLICT DO NOTHING;
