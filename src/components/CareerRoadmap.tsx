import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { MasterProfile } from '../lib/supabase'
import { generateCareerRoadmap } from '../lib/ai'
import { generateRoadmapFallback } from '../lib/analyzer'
import { Card, Button, Badge, Spinner } from './ui'
import { Map, Flag, Compass, ChevronRight, Wand2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface RoadmapData {
  target_role: string
  estimated_timeline: string
  milestones: {
    title: string
    description: string
    timeframe: string
    status: 'completed' | 'in-progress' | 'pending'
  }[]
}

export function CareerRoadmap() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('master_profiles').select('*').maybeSingle()
    setProfile(data as MasterProfile | null)
    // If we had a database table for roadmaps, we'd fetch it here.
    // For now, it generates on demand.
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!profile) return
    setGenerating(true)
    
    try {
      const data = await generateCareerRoadmap(profile)
      setRoadmap(data)
    } catch (err) {
      console.warn('AI failed, using fallback:', err)
      const data = generateRoadmapFallback(profile)
      setRoadmap(data)
    } finally {
      setGenerating(false)
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-ink-100 to-ink-400 flex items-center gap-4">
            <Compass className="w-8 h-8 text-ink-300" />
            Career Roadmap
          </h1>
          <p className="text-ink-400 mt-2 text-lg">AI-generated milestones to reach your ultimate career goal.</p>
        </div>
        <Button onClick={handleGenerate} loading={generating} disabled={!profile?.full_name} className="bg-gradient-to-r from-brand-500 to-brand-600 shrink-0">
          <Wand2 className="w-4 h-4 mr-2" />
          {roadmap ? 'Regenerate Roadmap' : 'Generate Roadmap'}
        </Button>
      </div>

      {!profile?.full_name && (
        <Card className="p-5 border-accent-500/20 bg-accent-500/5 glass flex items-center justify-between">
          <p className="text-ink-200">Please complete your Master Profile first to generate a customized roadmap.</p>
          <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-all">
            Update Profile
          </button>
        </Card>
      )}

      {roadmap && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="p-8 glass relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-brand-500/10 blur-[100px] pointer-events-none rounded-full" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-ink-800/50 pb-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-1">Target Role</p>
                <h2 className="text-3xl font-bold font-display text-white">{roadmap.target_role}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-1">Estimated Timeline</p>
                <Badge color="blue" className="text-sm px-3 py-1.5">{roadmap.estimated_timeline}</Badge>
              </div>
            </div>

            <div className="relative z-10 pt-8">
              <div className="absolute left-8 top-12 bottom-0 w-px bg-ink-800/50 hidden md:block" />
              
              <div className="space-y-8">
                {roadmap.milestones.map((milestone, idx) => (
                  <div key={idx} className="relative flex flex-col md:flex-row gap-6 md:items-start group">
                    <div className="hidden md:flex shrink-0 w-16 h-16 rounded-full bg-ink-900 border-4 border-ink-950 items-center justify-center relative z-10 shadow-lg shadow-black/50">
                      {milestone.status === 'completed' ? (
                        <Flag className="w-6 h-6 text-brand-400" />
                      ) : milestone.status === 'in-progress' ? (
                        <Map className="w-6 h-6 text-accent-400" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-ink-700" />
                      )}
                    </div>
                    
                    <Card className={`flex-1 p-6 ${milestone.status === 'completed' ? 'border-brand-500/30 bg-brand-500/5' : milestone.status === 'in-progress' ? 'border-accent-500/30 bg-accent-500/5' : 'bg-ink-900/30 border-ink-800/50'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                        <h3 className="text-xl font-semibold text-ink-100 group-hover:text-white transition-colors">{milestone.title}</h3>
                        <Badge color={milestone.status === 'completed' ? 'green' : milestone.status === 'in-progress' ? 'amber' : 'default'} className="shrink-0 w-fit">
                          {milestone.timeframe}
                        </Badge>
                      </div>
                      <p className="text-ink-400 leading-relaxed">{milestone.description}</p>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {!roadmap && profile?.full_name && !generating && (
        <Card className="p-16 glass flex flex-col items-center justify-center text-center border-dashed border-ink-700/50">
          <Map className="w-16 h-16 text-ink-700 mb-4" />
          <h3 className="text-xl font-semibold text-ink-200 mb-2">No Roadmap Generated</h3>
          <p className="text-ink-400 max-w-md">Click the Generate Roadmap button above to get a personalized step-by-step career plan from our AI.</p>
        </Card>
      )}
    </div>
  )
}
