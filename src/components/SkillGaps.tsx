import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { SkillGap, JobPosting, MasterProfile, Recommendation } from '../lib/supabase'
import { analyzeSkillGap } from '../lib/analyzer'
import { generateGapAnalysis } from '../lib/ai'
import { Card, Badge, ScoreRing, Button, Spinner, EmptyState } from './ui'
import { Target, Activity, Trash2, GraduationCap, ChevronRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function SkillGaps() {
  const navigate = useNavigate()
  const [gaps, setGaps] = useState<SkillGap[]>([])
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [profile, setProfile] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [gapsRes, jobsRes, profileRes] = await Promise.all([
      supabase.from('skill_gaps').select('*').order('created_at', { ascending: false }),
      supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
      supabase.from('master_profiles').select('*').maybeSingle(),
    ])
    setGaps((gapsRes.data ?? []) as SkillGap[])
    setJobs((jobsRes.data ?? []) as JobPosting[])
    setProfile(profileRes.data as MasterProfile | null)
    setLoading(false)
  }

  const handleAnalyze = async () => {
    if (!selectedJobId || !profile) return
    setAnalyzing(true)
    const job = jobs.find((j) => j.id === selectedJobId)
    if (!job) { setAnalyzing(false); return }

    try {
      const result = await generateGapAnalysis(profile, job)
      await supabase.from('skill_gaps').insert({
        job_posting_id: job.id,
        ...result
      })
    } catch (err) {
      console.warn("AI gap analysis failed or key missing, falling back to local extraction:", err)
      const result = analyzeSkillGap(profile, job)
      await supabase.from('skill_gaps').insert({
        job_posting_id: job.id,
        matched_skills: result.matched_skills,
        missing_skills: result.missing_skills,
        recommendations: result.recommendations,
        overall_score: result.overall_score,
      })
    } finally {
      setAnalyzing(false)
      setSelectedJobId('')
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('skill_gaps').delete().eq('id', id)
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
        <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-ink-100 to-ink-400">Skill Gap Analysis</h1>
        <p className="text-ink-400 mt-2 text-lg">Compare your skills against job requirements and get AI-powered learning recommendations</p>
      </div>

      {/* Job selector */}
      {jobs.length > 0 && (profile?.skills?.length ?? 0) > 0 ? (
        <Card className="p-8 space-y-6 glass relative overflow-hidden">
          <div className="absolute top-0 left-0 p-32 bg-accent-500/10 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="flex flex-col md:flex-row gap-5 items-end relative z-10">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold uppercase tracking-wider text-ink-300 mb-2">Select a job posting to analyze</label>
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
            <Button onClick={handleAnalyze} loading={analyzing} disabled={!selectedJobId} className="w-full md:w-auto bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 py-3">
              <Activity className="w-4 h-4 mr-2" /> Run Analysis
            </Button>
          </div>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 border-accent-500/20 bg-accent-500/5 glass flex items-center justify-between">
            <p className="text-ink-200">
              {jobs.length === 0
                ? "No job postings yet. Analyze a job first to compare your skills."
                : "No skills in your profile. Add skills to run gap analysis."
              }
            </p>
            <button 
              onClick={() => jobs.length === 0 ? navigate('/analyzer') : navigate('/profile')} 
              className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              {jobs.length === 0 ? "Analyze Job" : "Add Skills"}
            </button>
          </Card>
        </motion.div>
      )}

      {/* Results */}
      {gaps.length === 0 && jobs.length > 0 && (profile?.skills?.length ?? 0) > 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8 text-ink-600" />}
          title="No analyses yet"
          description="Select a job above and run an analysis to see your skill gaps and personalized learning recommendations."
        />
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {gaps.map((gap) => {
              const job = jobs.find((j) => j.id === gap.job_posting_id)
              return (
                <motion.div key={gap.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                  <Card className="p-8 glass group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-24 bg-brand-500/5 blur-[80px] pointer-events-none rounded-full" />
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 relative z-10">
                      <div>
                        <h3 className="text-2xl font-bold font-display text-white mb-1">{job?.title ?? 'Unknown Job'}</h3>
                        <p className="text-lg text-ink-400">{job?.company ?? ''}</p>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <ScoreRing score={gap.overall_score} size={90} strokeWidth={8} label="Match" />
                        <button onClick={() => handleDelete(gap.id)} className="p-2 text-ink-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                      {/* Matched */}
                      <div className="bg-ink-900/30 rounded-2xl p-6 border border-brand-500/20">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-400 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Matched Skills ({gap.matched_skills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {gap.matched_skills.length > 0 ? gap.matched_skills.map((s) => (
                            <Badge key={s} color="green" className="px-3 py-1.5 text-sm">{s}</Badge>
                          )) : <span className="text-sm text-ink-500">None matched</span>}
                        </div>
                      </div>

                      {/* Missing */}
                      <div className="bg-ink-900/30 rounded-2xl p-6 border border-accent-500/20">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-accent-400 mb-4 flex items-center gap-2">
                          <XCircle className="w-4 h-4" /> Missing Skills ({gap.missing_skills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {gap.missing_skills.length > 0 ? gap.missing_skills.map((s) => (
                            <Badge key={s} color="amber" className="px-3 py-1.5 text-sm">{s}</Badge>
                          )) : <span className="text-sm text-ink-500">No gaps! You're a perfect match.</span>}
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {gap.recommendations?.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-ink-800/50 relative z-10">
                        <h4 className="text-lg font-semibold text-ink-100 mb-5 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-brand-400" /> Learning Recommendations
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {gap.recommendations.map((rec: Recommendation, i: number) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-ink-900/50 border border-ink-700/30 hover:border-ink-600/50 transition-colors">
                              <div className="mt-1">
                                {rec.priority === 'high' ? (
                                  <AlertCircle className="w-5 h-5 text-red-400" />
                                ) : rec.priority === 'medium' ? (
                                  <AlertCircle className="w-5 h-5 text-amber-400" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-ink-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-base font-semibold text-white">{rec.skill}</p>
                                  <Badge className="text-[10px] uppercase px-1.5" color={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'amber' : 'default'}>
                                    {rec.priority} Priority
                                  </Badge>
                                </div>
                                <p className="text-sm text-ink-300 flex items-center gap-1.5">
                                  <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
                                  {rec.resource}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
