alter table "public"."pickup_sessions" add column if not exists "fee" numeric default '0';
