import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { JobPosting, MasterProfile } from '../lib/supabase'
import { extractKeywords, extractRequirements, extractResponsibilities, computeMatchScore } from '../lib/analyzer'
import { analyzeJobPosting } from '../lib/ai'
import { Button, Card, Textarea, Badge, ScoreRing, Spinner, EmptyState } from './ui'
import { Briefcase, Link as LinkIcon, Trash2, MapPin, Building2, Search, CheckCircle2, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function JobAnalyzer() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [profile, setProfile] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')

  // Analysis preview
  const [preview, setPreview] = useState<{ keywords: string[]; requirements: string[]; responsibilities: string[]; matchScore: number } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [jobsRes, profileRes] = await Promise.all([
      supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
      supabase.from('master_profiles').select('*').maybeSingle(),
    ])
    setJobs((jobsRes.data ?? []) as JobPosting[])
    setProfile(profileRes.data as MasterProfile | null)
    setLoading(false)
  }

  const handleAnalyze = async () => {
    if (!description.trim()) return
    setAnalyzing(true)
    
    try {
      const aiResult = await analyzeJobPosting(description)
      const matchScore = profile?.skills?.length ? computeMatchScore(profile.skills, aiResult.keywords) : 0
      setPreview({ ...aiResult, matchScore })
    } catch (err) {
      console.warn("AI parsing failed or key missing, falling back to local extraction:", err)
      // Fallback to local regex-based logic
      const keywords = extractKeywords(description)
      const requirements = extractRequirements(description)
      const responsibilities = extractResponsibilities(description)
      const matchScore = profile?.skills?.length ? computeMatchScore(profile.skills, keywords) : 0
      setPreview({ keywords, requirements, responsibilities, matchScore })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return
    const keywords = preview?.keywords ?? extractKeywords(description)
    const requirements = preview?.requirements ?? extractRequirements(description)
    const responsibilities = preview?.responsibilities ?? extractResponsibilities(description)
    const matchScore = profile?.skills?.length ? computeMatchScore(profile.skills, keywords) : 0

    const { data } = await supabase.from('job_postings').insert({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      description: description.trim(),
      source_url: url.trim(),
      parsed_keywords: keywords,
      requirements,
      responsibilities,
      match_score: matchScore,
    }).select('*').single()

    if (data) {
      // Also create a tracker entry
      await supabase.from('application_tracker').insert({
        job_posting_id: (data as JobPosting).id,
        title: (data as JobPosting).title,
        company: (data as JobPosting).company,
        location: (data as JobPosting).location,
        status: 'discovered',
        match_score: matchScore,
      })
    }

    // Reset form
    setTitle(''); setCompany(''); setLocation(''); setUrl(''); setDescription('')
    setPreview(null)
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('job_postings').delete().eq('id', id)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Spinner className="text-brand-500 w-10 h-10" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-ink-100 to-ink-400">Job Analyzer</h1>
        <p className="text-ink-400 mt-2 text-lg">Paste a job description — our AI agents extract keywords, requirements, and match score</p>
      </div>

      {!profile?.skills?.length && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 border-accent-500/20 bg-accent-500/5 glass flex items-center justify-between">
            <p className="text-ink-200">
              No skills in your profile yet. Add skills to get accurate match scores.
            </p>
            <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-all">
              Add Skills
            </button>
          </Card>
        </motion.div>
      )}

      {/* Input form */}
      <Card className="p-8 space-y-6 glass relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-brand-500/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          <div className="relative">
            <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-ink-500" />
            <input className="input-field pl-10 bg-ink-900/50" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job Title *" />
          </div>
          <div className="relative">
            <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-ink-500" />
            <input className="input-field pl-10 bg-ink-900/50" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-ink-500" />
            <input className="input-field pl-10 bg-ink-900/50" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
          </div>
        </div>
        
        <div className="relative z-10">
          <LinkIcon className="absolute left-3 top-3.5 w-5 h-5 text-ink-500" />
          <input className="input-field pl-10 bg-ink-900/50" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Source URL (optional)" />
        </div>
        
        <div className="relative z-10">
          <Textarea
            label="Job Description"
            rows={10}
            value={description}
            onChange={(e) => { setDescription(e.target.value); setPreview(null) }}
            placeholder="Paste the full job description here..."
            className="bg-ink-900/50"
          />
        </div>
        
        <div className="flex gap-4 relative z-10">
          <Button variant="secondary" onClick={handleAnalyze} loading={analyzing} disabled={!description.trim()} className="flex-1">
            <Search className="w-4 h-4 mr-2" />
            Analyze with AI
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !description.trim()} className="flex-1 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Save Job Posting
          </Button>
        </div>
      </Card>

      {/* Analysis preview */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
            <Card className="p-8 space-y-8 glass border-brand-500/30 shadow-[0_0_40px_rgba(24,176,125,0.1)]">
              <div className="flex flex-col md:flex-row items-center gap-8 border-b border-ink-800/50 pb-8">
                <div className="shrink-0 relative">
                  <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full" />
                  <ScoreRing score={preview.matchScore} label="Your Match" size={140} strokeWidth={10} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-display text-white mb-2">AI Analysis Complete</h3>
                  <p className="text-ink-300 text-lg">
                    We found <strong className="text-white">{preview.keywords.length}</strong> keywords, <strong className="text-white">{preview.requirements.length}</strong> requirements, and <strong className="text-white">{preview.responsibilities.length}</strong> responsibilities.
                  </p>
                </div>
              </div>

              {preview.keywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-4">Extracted Keywords</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {preview.keywords.map((kw) => {
                      const has = profile?.skills?.some((s) => s.toLowerCase() === kw.toLowerCase())
                      return <Badge key={kw} color={has ? 'green' : 'default'} className="px-3 py-1.5 text-sm">{kw}{has && ' ✓'}</Badge>
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {preview.requirements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-4">Requirements</h4>
                    <ul className="space-y-3">
                      {preview.requirements.map((r, i) => (
                        <li key={i} className="text-sm text-ink-200 flex gap-3 bg-ink-900/30 p-3 rounded-lg border border-ink-800/50">
                          <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                          <span className="pt-0.5">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {preview.responsibilities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-4">Responsibilities</h4>
                    <ul className="space-y-3">
                      {preview.responsibilities.map((r, i) => (
                        <li key={i} className="text-sm text-ink-200 flex gap-3 bg-ink-900/30 p-3 rounded-lg border border-ink-800/50">
                          <ChevronRight className="w-5 h-5 text-accent-400 shrink-0" />
                          <span className="pt-0.5">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved jobs */}
      <div className="pt-4">
        <h2 className="text-xl font-semibold text-ink-100 mb-6">Saved Job Postings</h2>
        {jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-8 h-8 text-ink-600" />}
            title="No jobs analyzed yet"
            description="Paste a job description above and click Analyze to see AI-extracted keywords and your match score."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="p-5 glass glass-hover group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-ink-100 group-hover:text-brand-300 transition-colors">{job.title}</h3>
                      <Badge color={job.match_score >= 75 ? 'green' : job.match_score >= 50 ? 'amber' : 'red'}>
                        {job.match_score}% Match
                      </Badge>
                    </div>
                    <p className="text-ink-400 flex items-center gap-2 mb-4">
                      <Building2 className="w-4 h-4" /> {job.company}
                      {job.location && <><MapPin className="w-4 h-4 ml-2" /> {job.location}</>}
                    </p>
                    {job.parsed_keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.parsed_keywords.slice(0, 10).map((kw) => (
                          <Badge key={kw} className="bg-ink-800/50 text-ink-300 border-ink-700/50">{kw}</Badge>
                        ))}
                        {job.parsed_keywords.length > 10 && <Badge className="bg-ink-900 border-dashed">+{job.parsed_keywords.length - 10} more</Badge>}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDelete(job.id)} className="p-2 text-ink-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
