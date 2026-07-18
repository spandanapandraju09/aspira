import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { JobPosting, MasterProfile } from '../lib/supabase'
import { generateInterviewQuestions, evaluateInterviewAnswer } from '../lib/ai'
import { Card, Button, Badge, Spinner, Textarea } from './ui'
import { Mic, MessageSquare, Play, Send, ChevronRight, CheckCircle2, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function MockInterview() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [profile, setProfile] = useState<MasterProfile | null>(null)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [generating, setGenerating] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  
  const [evaluating, setEvaluating] = useState(false)
  const [feedback, setFeedback] = useState<{ score: number; feedback: string; ideal_answer: string } | null>(null)
  
  useEffect(() => { loadData() }, [])
  
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

  const handleStart = async () => {
    setGenerating(true)
    try {
      const job = jobs.find(j => j.id === selectedJobId) || null
      const qs = await generateInterviewQuestions(job, profile)
      setQuestions(qs)
      setCurrentQ(0)
      setFeedback(null)
      setAnswer('')
    } catch (err) {
      console.error(err)
      alert("Failed to generate questions. Make sure your Gemini API key is set in Settings.")
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return
    setEvaluating(true)
    try {
      const result = await evaluateInterviewAnswer(questions[currentQ], answer)
      setFeedback(result)
    } catch (err) {
      console.error(err)
      alert("Failed to evaluate answer. Please check your API key.")
    } finally {
      setEvaluating(false)
    }
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1)
      setAnswer('')
      setFeedback(null)
    } else {
      // Done
      setQuestions([])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Spinner className="text-brand-500 w-10 h-10" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-ink-100 to-ink-400 flex items-center gap-4">
          <Mic className="w-8 h-8 text-ink-300" />
          Mock Interview
        </h1>
        <p className="text-ink-400 mt-2 text-lg">Practice with an AI interviewer tailored to your target job.</p>
      </div>

      {questions.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-8 glass space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-brand-500/10 blur-[100px] pointer-events-none rounded-full" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-5 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold uppercase tracking-wider text-ink-300 mb-2">Select a target role (Optional)</label>
                <select 
                  className="input-field bg-ink-900/50 appearance-none" 
                  value={selectedJobId} 
                  onChange={(e) => setSelectedJobId(e.target.value)}
                >
                  <option value="">General Interview (Based on Profile)</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title} — {job.company}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleStart} loading={generating} className="w-full md:w-auto bg-gradient-to-r from-brand-500 to-brand-600">
                <Play className="w-4 h-4 mr-2 fill-current" /> Start Interview
              </Button>
            </div>
            
            {jobs.length === 0 && (
               <p className="text-sm text-ink-500 relative z-10 flex items-center gap-2">
                 <Target className="w-4 h-4" /> You can add job postings in the Job Analyzer to practice for specific roles.
               </p>
            )}
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <p className="text-ink-400 font-medium tracking-wider text-sm uppercase">Question {currentQ + 1} of {questions.length}</p>
            <div className="flex gap-2">
              {questions.map((_, i) => (
                <div key={i} className={`w-12 h-2 rounded-full transition-all ${i === currentQ ? 'bg-brand-500 shadow-[0_0_10px_rgba(24,176,125,0.5)]' : i < currentQ ? 'bg-brand-500/30' : 'bg-ink-800'}`} />
              ))}
            </div>
          </div>

          <Card className="p-8 glass border-brand-500/20 shadow-[0_0_30px_rgba(24,176,125,0.05)]">
            <div className="flex gap-4 items-start mb-8">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 mt-1">
                <MessageSquare className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <p className="text-sm text-brand-400 font-semibold uppercase tracking-wider mb-2">Interviewer</p>
                <h3 className="text-2xl font-medium text-white leading-relaxed">{questions[currentQ]}</h3>
              </div>
            </div>

            {!feedback ? (
              <div className="space-y-4">
                <Textarea 
                  rows={6}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="bg-ink-900/50 text-lg leading-relaxed border-ink-700/50 focus:border-brand-500/50"
                />
                <div className="flex justify-end">
                  <Button onClick={handleSubmitAnswer} loading={evaluating} disabled={!answer.trim()} className="bg-brand-500">
                    <Send className="w-4 h-4 mr-2" /> Submit Answer
                  </Button>
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-6 border-t border-ink-800/50 space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold font-display shadow-lg ${feedback.score >= 8 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : feedback.score >= 5 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {feedback.score}/10
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">AI Feedback</h4>
                    <p className="text-ink-400">Score & Recommendations</p>
                  </div>
                </div>

                <div className="bg-ink-900/40 rounded-xl p-5 border border-ink-800/50 text-ink-200 leading-relaxed whitespace-pre-line">
                  {feedback.feedback}
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Ideal Answer Structure
                  </h4>
                  <div className="bg-brand-500/5 rounded-xl p-5 border border-brand-500/10 text-brand-100/90 leading-relaxed whitespace-pre-line">
                    {feedback.ideal_answer}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleNext} className="bg-ink-100 text-ink-950 hover:bg-white">
                    {currentQ < questions.length - 1 ? 'Next Question' : 'Finish Interview'} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  )
}
