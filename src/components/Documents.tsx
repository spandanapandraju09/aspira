import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { JobPosting, MasterProfile, TailoredDocument } from '../lib/supabase'
import { generateResume } from '../lib/analyzer'
import { generateTailoredDocuments } from '../lib/ai'
import { Card, Button, Badge, ScoreRing, Spinner, EmptyState } from './ui'
import { FileText, Copy, Download, Trash2, Wand2, X, FileCheck, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Documents() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<TailoredDocument[]>([])
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [profile, setProfile] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [activeDoc, setActiveDoc] = useState<TailoredDocument | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [docsRes, jobsRes, profileRes] = await Promise.all([
      supabase.from('tailored_documents').select('*').order('created_at', { ascending: false }),
      supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
      supabase.from('master_profiles').select('*').maybeSingle(),
    ])
    setDocs((docsRes.data ?? []) as TailoredDocument[])
    setJobs((jobsRes.data ?? []) as JobPosting[])
    setProfile(profileRes.data as MasterProfile | null)
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!selectedJobId || !profile) return
    setGenerating(true)
    const job = jobs.find((j) => j.id === selectedJobId)
    if (!job) { setGenerating(false); return }

    let resultDoc: TailoredDocument | null = null

    try {
      const { resume, coverLetter, atsScore, notes } = await generateTailoredDocuments(profile, job)
      const { data } = await supabase.from('tailored_documents').insert({
        job_posting_id: job.id,
        resume_text: resume,
        cover_letter_text: coverLetter,
        ats_score: atsScore,
        quality_notes: notes,
      }).select('*').single()
      if (data) resultDoc = data as TailoredDocument
    } catch (err) {
      console.warn("AI generation failed or key missing, falling back to local generation:", err)
      const { resume, coverLetter, atsScore, notes } = generateResume(profile, job)
      const { data } = await supabase.from('tailored_documents').insert({
        job_posting_id: job.id,
        resume_text: resume,
        cover_letter_text: coverLetter,
        ats_score: atsScore,
        quality_notes: notes,
      }).select('*').single()
      if (data) resultDoc = data as TailoredDocument
    } finally {
      setGenerating(false)
      setSelectedJobId('')
      loadData()
      if (resultDoc) setActiveDoc(resultDoc)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('tailored_documents').delete().eq('id', id)
    if (activeDoc?.id === id) setActiveDoc(null)
    loadData()
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
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
        <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-ink-100 to-ink-400">Tailored Documents</h1>
        <p className="text-ink-400 mt-2 text-lg">Generate AI-tailored resumes and cover letters perfectly matched for each job</p>
      </div>

      {/* Generator */}
      {jobs.length > 0 && profile?.full_name ? (
        <Card className="p-8 space-y-6 glass relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-brand-500/10 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="flex flex-col md:flex-row gap-5 items-end relative z-10">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold uppercase tracking-wider text-ink-300 mb-2">Select a job posting</label>
              <select 
                className="input-field bg-ink-900/50 appearance-none" 
                value={selectedJobId} 
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                <option value="">Choose a job...</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title} — {job.company}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleGenerate} loading={generating} disabled={!selectedJobId} className="w-full md:w-auto bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 py-3">
              <Wand2 className="w-4 h-4 mr-2" /> Generate Documents
            </Button>
          </div>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 border-accent-500/20 bg-accent-500/5 glass flex items-center justify-between">
            <p className="text-ink-200">
              {jobs.length === 0
                ? "No job postings yet. Analyze a job first to generate documents."
                : "Profile incomplete. Add your details to generate documents."
              }
            </p>
            <button 
              onClick={() => jobs.length === 0 ? navigate('/analyzer') : navigate('/profile')} 
              className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              {jobs.length === 0 ? "Analyze Job" : "Update Profile"}
            </button>
          </Card>
        </motion.div>
      )}

      {/* Active document viewer */}
      <AnimatePresence>
        {activeDoc && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
            <Card className="p-8 space-y-6 glass border-brand-500/30 shadow-[0_0_40px_rgba(24,176,125,0.1)] relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] p-24 bg-brand-500/5 blur-[80px] pointer-events-none rounded-full" />
              
              <div className="flex items-start justify-between border-b border-ink-800/50 pb-6 relative z-10">
                <div className="flex items-center gap-6">
                  <ScoreRing score={activeDoc.ats_score} size={80} strokeWidth={8} label="ATS" />
                  <div>
                    <h3 className="text-2xl font-bold font-display text-white mb-1">Generated Documents</h3>
                    <p className="text-ink-300">ATS Optimization Score: <strong className="text-brand-400">{activeDoc.ats_score}/100</strong></p>
                  </div>
                </div>
                <button onClick={() => setActiveDoc(null)} className="p-2 text-ink-500 hover:text-white bg-ink-800/50 hover:bg-ink-700/50 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quality notes */}
              {activeDoc.quality_notes && (
                <div className="p-4 rounded-xl bg-ink-900/60 border border-ink-700/50 flex gap-3 relative z-10">
                  <FileCheck className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-ink-300 leading-relaxed whitespace-pre-line">{activeDoc.quality_notes}</p>
                </div>
              )}

              {/* Resume */}
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <h4 className="text-lg font-semibold text-ink-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-400" /> Tailored Resume
                  </h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => copyText(activeDoc.resume_text)}>
                      <Copy className="w-4 h-4 mr-2" /> Copy
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => downloadText(activeDoc.resume_text, 'resume.txt')}>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  </div>
                </div>
                <div className="p-1 rounded-2xl bg-gradient-to-br from-ink-800 to-ink-900">
                  <pre className="p-6 rounded-xl bg-ink-950/80 text-sm text-ink-200 whitespace-pre-wrap font-mono h-96 overflow-auto scrollbar-thin">
                    {activeDoc.resume_text}
                  </pre>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="relative z-10 pt-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <h4 className="text-lg font-semibold text-ink-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent-400" /> Cover Letter
                  </h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => copyText(activeDoc.cover_letter_text)}>
                      <Copy className="w-4 h-4 mr-2" /> Copy
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => downloadText(activeDoc.cover_letter_text, 'cover-letter.txt')}>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  </div>
                </div>
                <div className="p-1 rounded-2xl bg-gradient-to-br from-ink-800 to-ink-900">
                  <pre className="p-6 rounded-xl bg-ink-950/80 text-sm text-ink-200 whitespace-pre-wrap font-mono h-96 overflow-auto scrollbar-thin">
                    {activeDoc.cover_letter_text}
                  </pre>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved documents */}
      <div className="pt-4">
        <h2 className="text-xl font-semibold text-ink-100 mb-6">Saved Documents</h2>
        {docs.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-ink-600" />}
            title="No documents generated yet"
            description="Select a job posting above and generate a tailored resume and cover letter."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {docs.map((doc) => {
              const job = jobs.find((j) => j.id === doc.job_posting_id)
              return (
                <Card key={doc.id} className="p-5 glass glass-hover group flex flex-col justify-between h-full">
                  <div className="cursor-pointer" onClick={() => setActiveDoc(doc)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 pr-4">
                        <h3 className="font-semibold text-ink-100 group-hover:text-brand-300 transition-colors truncate">{job?.title ?? 'Unknown Job'}</h3>
                        <p className="text-sm text-ink-400 truncate">{job?.company ?? ''}</p>
                      </div>
                      <Badge color={doc.ats_score >= 75 ? 'green' : doc.ats_score >= 50 ? 'amber' : 'red'} className="shrink-0">
                        ATS {doc.ats_score}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-500 mb-4">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 mt-auto pt-4 border-t border-ink-800/50">
                    <Button size="sm" variant="secondary" onClick={() => setActiveDoc(doc)} className="flex-1">
                      <Search className="w-4 h-4 mr-2" /> View
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleDelete(doc.id)} className="hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
