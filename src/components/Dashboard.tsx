import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { MasterProfile, JobPosting, Application, SkillGap } from '../lib/supabase'
import { Card, ScoreRing, Badge, Spinner } from './ui'
import { Briefcase, Target, Kanban, Search, ChevronRight, Activity, ArrowUpRight, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Stats {
  profile: MasterProfile | null
  jobs: JobPosting[]
  applications: Application[]
  gaps: SkillGap[]
}

const mockActivityData = [
  { name: 'Mon', applications: 2, interviews: 0 },
  { name: 'Tue', applications: 3, interviews: 1 },
  { name: 'Wed', applications: 1, interviews: 0 },
  { name: 'Thu', applications: 4, interviews: 2 },
  { name: 'Fri', applications: 2, interviews: 1 },
  { name: 'Sat', applications: 0, interviews: 0 },
  { name: 'Sun', applications: 1, interviews: 0 },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    const [profileRes, jobsRes, appsRes, gapsRes] = await Promise.all([
      supabase.from('master_profiles').select('*').maybeSingle(),
      supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
      supabase.from('application_tracker').select('*').order('created_at', { ascending: false }),
      supabase.from('skill_gaps').select('*').order('created_at', { ascending: false }),
    ])

    setStats({
      profile: profileRes.data as MasterProfile | null,
      jobs: (jobsRes.data ?? []) as JobPosting[],
      applications: (appsRes.data ?? []) as Application[],
      gaps: (gapsRes.data ?? []) as SkillGap[],
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Spinner className="text-brand-500 w-10 h-10" />
      </div>
    )
  }

  const hasProfile = stats?.profile && stats.profile.full_name
  const jobs = stats?.jobs ?? []
  const apps = stats?.applications ?? []
  const gaps = stats?.gaps ?? []

  const statusCounts = {
    discovered: apps.filter((a) => a.status === 'discovered').length,
    applied: apps.filter((a) => a.status === 'applied').length,
    interview: apps.filter((a) => a.status === 'interview').length,
    offer: apps.filter((a) => a.status === 'offer').length,
    rejected: apps.filter((a) => a.status === 'rejected').length,
  }

  const avgMatch = jobs.length > 0
    ? Math.round(jobs.reduce((sum, j) => sum + (j.match_score || 0), 0) / jobs.length)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">
            Welcome back, {hasProfile ? stats.profile!.full_name.split(' ')[0] : 'Explorer'}
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Here's your career intelligence for today.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/analyzer')} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 text-slate-700 rounded-xl transition-all border border-slate-300">
            <Search className="w-4 h-4" /> Analyze JD
          </button>
          <button onClick={() => navigate('/tracker')} className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-slate-900 rounded-xl transition-all shadow-lg shadow-pink-500/20 font-medium">
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>
      </div>

      {/* Onboarding prompt */}
      {!hasProfile && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="p-[1px] rounded-2xl bg-gradient-to-r from-brand-500/50 to-accent-500/50">
            <div className="p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Target className="text-brand-400 w-6 h-6" /> Complete your Master Profile
                </h3>
                <p className="text-slate-600 max-w-xl text-lg">Add your skills, experience, and education to unlock AI-powered job analysis and perfectly tailored resumes.</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="shrink-0 px-6 py-3 bg-white text-ink-950 rounded-xl font-semibold hover:bg-ink-100 transition-all flex items-center gap-2"
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Jobs Analyzed" value={jobs.length} icon={<Search className="text-blue-400" />} onClick={() => navigate('/analyzer')} trend="+12% this week" />
        <StatCard label="Active Applications" value={apps.length} icon={<Briefcase className="text-brand-400" />} onClick={() => navigate('/tracker')} trend="+3 this week" />
        <StatCard label="Interviews" value={statusCounts.interview} icon={<Target className="text-accent-400" />} onClick={() => navigate('/tracker')} trend="Next in 2 days" />
        <StatCard label="Avg Match Score" value={`${avgMatch}%`} icon={<Activity className="text-purple-400" />} onClick={() => navigate('/analyzer')} trend="Top 10% in field" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="p-6 lg:col-span-2 glass flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-brand-500/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-lg font-semibold text-slate-800">Weekly Activity</h2>
          </div>
          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18b07d" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#18b07d" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5810b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f5810b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a414f" vertical={false} />
                <XAxis dataKey="name" stroke="#8590a8" tick={{ fill: '#8590a8', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#8590a8" tick={{ fill: '#8590a8', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131620', borderColor: '#3a414f', borderRadius: '12px' }} 
                  itemStyle={{ color: '#eceef2' }}
                />
                <Area type="monotone" dataKey="applications" stroke="#18b07d" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                <Area type="monotone" dataKey="interviews" stroke="#f5810b" strokeWidth={3} fillOpacity={1} fill="url(#colorInt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pipeline Summary */}
        <Card className="p-6 glass flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Pipeline Status</h2>
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {(['applied', 'interview', 'offer'] as const).map((status, i) => (
              <div key={status} className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${status === 'offer' ? 'bg-brand-400' : status === 'interview' ? 'bg-accent-400' : 'bg-blue-400'} shadow-[0_0_10px_currentColor]`} />
                  <p className="text-sm font-medium text-slate-700 capitalize">{status}</p>
                </div>
                <p className="text-xl font-bold font-display text-slate-900">{statusCounts[status]}</p>
              </div>
            ))}
            <button onClick={() => navigate('/tracker')} className="w-full py-3 mt-2 text-sm font-medium text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 rounded-xl transition-all flex items-center justify-center gap-2">
              View Kanban Board <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card className="p-6 glass">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Recent Job Analyses</h2>
          {jobs.length > 0 && (
            <button onClick={() => navigate('/analyzer')} className="text-sm font-medium text-brand-400 hover:text-brand-300">
              View All
            </button>
          )}
        </div>
        {jobs.length === 0 ? (
          <div className="py-8 text-center bg-ink-900/30 rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500 mb-4">No jobs analyzed yet. Paste a job description to see how well you match.</p>
            <button onClick={() => navigate('/analyzer')} className="px-5 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-sm font-medium hover:bg-ink-700 transition-all">
              Analyze First Job
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="group flex items-center justify-between p-4 rounded-xl bg-white/50 border border-slate-200 hover:border-ink-600 hover:bg-slate-50/40 transition-all cursor-pointer">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="font-medium text-slate-800 truncate mb-1 group-hover:text-brand-300 transition-colors">{job.title}</p>
                  <p className="text-sm text-slate-500 truncate">{job.company} {job.location && `• ${job.location}`}</p>
                </div>
                <div className="shrink-0 flex items-center gap-4">
                  <Badge color={job.match_score >= 75 ? 'green' : job.match_score >= 50 ? 'amber' : 'red'}>
                    {job.match_score}% Match
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-ink-500 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon, trend, onClick }: { label: string; value: string | number; icon: React.ReactNode; trend: string; onClick: () => void }) {
  return (
    <motion.button 
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick} 
      className="text-left outline-none w-full"
    >
      <Card className="p-6 glass glass-hover relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-bl-full transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shadow-inner border border-slate-300">
            {icon}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-3xl font-bold font-display text-slate-900 mb-1">{value}</p>
          <p className="text-sm font-medium text-slate-600">{label}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 relative z-10 flex items-center gap-1.5 text-xs text-slate-500">
          <ArrowUpRight className="w-3 h-3 text-brand-400" /> {trend}
        </div>
      </Card>
    </motion.button>
  )
}
