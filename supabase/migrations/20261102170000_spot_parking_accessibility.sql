-- Optional parking and wheelchair access on sunset spots.
-- Run in the Supabase SQL editor before deploying the app that reads these columns.
-- Safe to run more than once.
--
-- Prisma model Spot uses table "Spot". Notes are snake_case (parking_note,
-- accessibility_note), matching client_request_id. parking and accessibility
-- are text, not a Postgres enum, so a later label change is an app change.
-- Allowed values: parking yes|paid|no, accessibility yes|partial|no. Null means
-- the contributor did not answer.
--
-- Inserts go through Prisma with the database owner role, which bypasses RLS.
-- This app does not insert spots with the anon key, and no policy lists columns
-- individually, so existing RLS policies do not need an edit.

alter table "Spot"
  add column if not exists parking text,
  add column if not exists parking_note text,
  add column if not exists accessibility text,
  add column if not exists accessibility_note text;

alter table "Spot" drop constraint if exists "Spot_parking_check";
alter table "Spot"
  add constraint "Spot_parking_check"
  check (parking is null or parking in ('yes', 'paid', 'no'));

alter table "Spot" drop constraint if exists "Spot_accessibility_check";
alter table "Spot"
  add constraint "Spot_accessibility_check"
  check (accessibility is null or accessibility in ('yes', 'partial', 'no'));

alter table "Spot" drop constraint if exists "Spot_parking_note_length";
alter table "Spot"
  add constraint "Spot_parking_note_length"
  check (parking_note is null or char_length(parking_note) <= 200);

alter table "Spot" drop constraint if exists "Spot_accessibility_note_length";
alter table "Spot"
  add constraint "Spot_accessibility_note_length"
  check (accessibility_note is null or char_length(accessibility_note) <= 200);
