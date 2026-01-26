-- Rollback: Remove the added sports
DELETE FROM public.sports 
WHERE name IN (
  'Hockey',
  'Lacrosse',
  'Pickleball',
  'Ultimate Frisbee',
  'Football',
  'Baseball',
  'Softball',
  'Rugby',
  'Badminton',
  'Table Tennis'
);
