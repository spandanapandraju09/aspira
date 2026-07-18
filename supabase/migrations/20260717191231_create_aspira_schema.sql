/*
# AspiraAI — Core Schema

## Overview
Creates the multi-user relational schema for AspiraAI: master profiles,
job postings, application tracker (Kanban), tailored documents, and
skill-gap analyses. All tables are owner-scoped to the authenticated user
via `user_id uuid NOT NULL DEFAULT auth.uid()` and RLS.

## New Tables
1. `master_profiles` — single source of truth for a user's resume data
   (education, experience, skills, certifications, preferences).
2. `job_postings` — analyzed job descriptions with parsed keywords and
   requirements.
3. `application_tracker` — Kanban pipeline cards (discovered, applied,
   interviewing, rejected, offer).
4. `tailored_documents` — AI-generated resume variants + cover letters.
5. `skill_gaps` — gap analyses comparing a user's skills to a job's
   requirements with recommended actions.

## Security
- RLS enabled on every table.
- Owner-scoped CRUD policies (select/insert/update/delete) for
  `authenticated` users using `auth.uid() = user_id`.
- Owner columns default to `auth.uid()` so client inserts that omit
  `user_id` still satisfy `WITH CHECK`.

## Notes
- `user_id` is `NOT NULL DEFAULT auth.uid()`.
- Cascading deletes keep child rows consistent when a parent is removed.
- `jsonb` columns hold flexible nested data (education entries, experience
  entries, skills arrays, parsed keywords, etc.).
*/

CREATE TABLE IF NOT EXISTS master_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  headline text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  location text DEFAULT '',
  summary text DEFAULT '',
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  experience jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills text[] NOT NULL DEFAULT '{}',
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE master_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_master_profiles" ON master_profiles;
CREATE POLICY "select_own_master_profiles" ON master_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_master_profiles" ON master_profiles;
CREATE POLICY "insert_own_master_profiles" ON master_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_master_profiles" ON master_profiles;
CREATE POLICY "update_own_master_profiles" ON master_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_master_profiles" ON master_profiles;
CREATE POLICY "delete_own_master_profiles" ON master_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  location text DEFAULT '',
  description text NOT NULL DEFAULT '',
  source_url text DEFAULT '',
  parsed_keywords text[] NOT NULL DEFAULT '{}',
  requirements text[] NOT NULL DEFAULT '{}',
  responsibilities text[] NOT NULL DEFAULT '{}',
  match_score integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_job_postings" ON job_postings;
CREATE POLICY "select_own_job_postings" ON job_postings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_job_postings" ON job_postings;
CREATE POLICY "insert_own_job_postings" ON job_postings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_job_postings" ON job_postings;
CREATE POLICY "update_own_job_postings" ON job_postings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_job_postings" ON job_postings;
CREATE POLICY "delete_own_job_postings" ON job_postings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS application_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_posting_id uuid REFERENCES job_postings(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  location text DEFAULT '',
  status text NOT NULL DEFAULT 'discovered',
  match_score integer DEFAULT 0,
  notes text DEFAULT '',
  applied_date date,
  interview_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tracker_status_check CHECK (
    status IN ('discovered','applied','interviewing','rejected','offer')
  )
);

ALTER TABLE application_tracker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_applications" ON application_tracker;
CREATE POLICY "select_own_applications" ON application_tracker
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_applications" ON application_tracker;
CREATE POLICY "insert_own_applications" ON application_tracker
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_applications" ON application_tracker;
CREATE POLICY "update_own_applications" ON application_tracker
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_applications" ON application_tracker;
CREATE POLICY "delete_own_applications" ON application_tracker
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS tailored_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_posting_id uuid REFERENCES job_postings(id) ON DELETE CASCADE,
  application_id uuid REFERENCES application_tracker(id) ON DELETE SET NULL,
  resume_text text NOT NULL DEFAULT '',
  cover_letter_text text NOT NULL DEFAULT '',
  ats_score integer DEFAULT 0,
  quality_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tailored_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON tailored_documents;
CREATE POLICY "select_own_documents" ON tailored_documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON tailored_documents;
CREATE POLICY "insert_own_documents" ON tailored_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON tailored_documents;
CREATE POLICY "update_own_documents" ON tailored_documents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON tailored_documents;
CREATE POLICY "delete_own_documents" ON tailored_documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS skill_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_posting_id uuid REFERENCES job_postings(id) ON DELETE CASCADE,
  matched_skills text[] NOT NULL DEFAULT '{}',
  missing_skills text[] NOT NULL DEFAULT '{}',
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_score integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE skill_gaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_skill_gaps" ON skill_gaps;
CREATE POLICY "select_own_skill_gaps" ON skill_gaps
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_skill_gaps" ON skill_gaps;
CREATE POLICY "insert_own_skill_gaps" ON skill_gaps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_skill_gaps" ON skill_gaps;
CREATE POLICY "update_own_skill_gaps" ON skill_gaps
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_skill_gaps" ON skill_gaps;
CREATE POLICY "delete_own_skill_gaps" ON skill_gaps
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_master_profiles_user_id ON master_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_user_id ON job_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_application_tracker_user_id ON application_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_application_tracker_status ON application_tracker(status);
CREATE INDEX IF NOT EXISTS idx_tailored_documents_user_id ON tailored_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_user_id ON skill_gaps(user_id);
