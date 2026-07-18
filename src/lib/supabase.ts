import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if variables are missing or if they are just the dummy placeholders
export const isDemoMode = !envUrl || !envKey || !envUrl.startsWith('http')

export const supabase = createClient(
  isDemoMode ? 'https://demo-project.supabase.co' : envUrl,
  isDemoMode ? 'demo-key-123456789' : envKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// ── Types ──────────────────────────────────────────────────────────────────

export interface MasterProfile {
  id: string
  user_id: string
  full_name: string
  headline: string
  email: string
  phone: string
  location: string
  summary: string
  education: Education[]
  experience: Experience[]
  skills: string[]
  certifications: Certification[]
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Education {
  degree: string
  institution: string
  year: string
  details?: string
}

export interface Experience {
  role: string
  company: string
  duration: string
  description: string
}

export interface Certification {
  name: string
  issuer: string
  year: string
}

export interface JobPosting {
  id: string
  user_id: string
  title: string
  company: string
  location: string
  description: string
  source_url: string
  parsed_keywords: string[]
  requirements: string[]
  responsibilities: string[]
  match_score: number
  created_at: string
}

export type AppStatus = 'discovered' | 'applied' | 'interview' | 'offer' | 'rejected'

export interface Application {
  id: string
  user_id: string
  job_posting_id: string | null
  title: string
  company: string
  location: string
  status: AppStatus
  match_score: number
  notes: string
  applied_date: string | null
  interview_date: string | null
  created_at: string
  updated_at: string
}

export interface SkillGap {
  id: string
  user_id: string
  job_posting_id: string | null
  matched_skills: string[]
  missing_skills: string[]
  recommendations: Recommendation[]
  overall_score: number
  created_at: string
}

export interface Recommendation {
  skill: string
  resource: string
  priority: 'high' | 'medium' | 'low'
}

export interface TailoredDocument {
  id: string
  user_id: string
  job_posting_id: string | null
  application_id: string | null
  resume_text: string
  cover_letter_text: string
  ats_score: number
  quality_notes: string
  created_at: string
}
