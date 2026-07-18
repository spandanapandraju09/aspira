import { useEffect, useState, DragEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Application, AppStatus } from '../lib/supabase'
import { Card, Badge, Button, Input, Spinner, EmptyState } from './ui'
import { KanbanSquare, Plus, Trash2, Building2, MapPin, CheckCircle2, Clock, Calendar, Briefcase } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const COLUMNS: { status: AppStatus; label: string; color: string; bg: string }[] = [
  { status: 'discovered', label: 'Discovered', color: 'border-t-blue-500', bg: 'bg-blue-500/10 text-blue-400' },
  { status: 'applied', label: 'Applied', color: 'border-t-brand-500', bg: 'bg-brand-500/10 text-brand-400' },
  { status: 'interview', label: 'Interview', color: 'border-t-accent-500', bg: 'bg-accent-500/10 text-accent-400' },
  { status: 'offer', label: 'Offer', color: 'border-t-green-500', bg: 'bg-green-500/10 text-green-400' },
  { status: 'rejected', label: 'Rejected', color: 'border-t-red-500', bg: 'bg-red-500/10 text-red-400' },
]

export function Tracker() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newLocation, setNewLocation] = useState('')

  useEffect(() => { loadApps() }, [])

  const loadApps = async () => {
    setLoading(true)
    const { data } = await supabase.from('application_tracker').select('*').order('created_at', { ascending: false })
    setApps((data ?? []) as Application[])
    setLoading(false)
  }

  const handleDragStart = (e: any, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    // This is required for Firefox
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDrop = async (e: any, status: AppStatus) => {
    e.preventDefault()
    if (!draggedId) return
    const app = apps.find((a) => a.id === draggedId)
    if (app && app.status !== status) {
      // Optimistic update
      setApps(apps.map((a) => a.id === draggedId ? { ...a, status } : a))
      
      const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
      if (status === 'applied' && !app.applied_date) updates.applied_date = new Date().toISOString().split('T')[0]
      if (status === 'interview' && !app.interview_date) updates.interview_date = new Date().toISOString().split('T')[0]
      await supabase.from('application_tracker').update(updates).eq('id', draggedId)
      loadApps()
    }
    setDraggedId(null)
  }

  const handleDragOver = (e: any) => { e.preventDefault() }

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await supabase.from('application_tracker').insert({
      title: newTitle.trim(),
      company: newCompany.trim(),
      location: newLocation.trim(),
      status: 'discovered',
    })
    setNewTitle(''); setNewCompany(''); setNewLocation('')
    setShowAdd(false)
    loadApps()
  }

  const handleDelete = async (id: string) => {
    setApps(apps.filter(a => a.id !== id))
    await supabase.from('application_tracker').delete().eq('id', id)
    loadApps()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Spinner className="text-brand-500 w-10 h-10" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-ink-100 to-ink-400">Application Tracker</h1>
          <p className="text-ink-400 mt-2 text-lg">Manage your job search pipeline with drag-and-drop</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className={showAdd ? "bg-ink-800 text-white hover:bg-ink-700" : "bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500"}>
          {showAdd ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add Application</>}
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="p-6 space-y-4 glass border-brand-500/30 shadow-[0_0_40px_rgba(24,176,125,0.1)] relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-ink-500" />
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Job Title *" className="pl-10 bg-ink-900/50" />
                </div>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-ink-500" />
                  <Input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company" className="pl-10 bg-ink-900/50" />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-ink-500" />
                  <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Location" className="pl-10 bg-ink-900/50" />
                </div>
              </div>
              <div className="flex justify-end relative z-10">
                <Button onClick={handleAdd} disabled={!newTitle.trim()}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Save Application
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {apps.length === 0 && !showAdd ? (
        <EmptyState
          icon={<KanbanSquare className="w-10 h-10 text-ink-600" />}
          title="Pipeline is empty"
          description="Add an application manually or analyze a job posting to start tracking."
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Application</Button>}
        />
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
          {COLUMNS.map((col) => {
            const colApps = apps.filter((a) => a.status === col.status)
            return (
              <div
                key={col.status}
                onDrop={(e) => handleDrop(e, col.status)}
                onDragOver={handleDragOver}
                className={`flex-none w-[320px] snap-center rounded-3xl border border-ink-800/50 ${col.color} bg-ink-950/40 backdrop-blur-sm min-h-[600px] transition-all flex flex-col ${draggedId ? 'ring-2 ring-brand-500/20 bg-ink-900/60' : ''}`}
              >
                <div className="p-4 flex items-center justify-between border-b border-ink-800/50">
                  <span className={`text-sm font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${col.bg}`}>{col.label}</span>
                  <span className="text-xs font-bold text-ink-400 bg-ink-900 px-2.5 py-1 rounded-full">{colApps.length}</span>
                </div>
                <div className="p-4 flex-1 space-y-4 overflow-y-auto">
                  <AnimatePresence>
                    {colApps.map((app) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        className="p-5 rounded-2xl bg-ink-900/80 border border-ink-700/50 shadow-lg cursor-grab active:cursor-grabbing hover:border-ink-500/50 hover:bg-ink-800/80 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-bold text-base text-ink-100 line-clamp-2 pr-6 leading-tight">{app.title}</p>
                          <button onClick={() => handleDelete(app.id)} className="absolute top-4 right-4 text-ink-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-1.5 mb-4">
                          <p className="text-sm font-medium text-ink-300 flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-ink-500" /> {app.company}
                          </p>
                          {app.location && (
                            <p className="text-xs text-ink-400 flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-ink-500" /> {app.location}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-4 border-t border-ink-800/50">
                          {app.match_score > 0 ? (
                            <Badge color={app.match_score >= 75 ? 'green' : app.match_score >= 50 ? 'amber' : 'red'} className="text-[10px] uppercase px-1.5 py-0.5">
                              {app.match_score}% Match
                            </Badge>
                          ) : <div />}
                          
                          <div className="flex flex-col items-end gap-1">
                            {app.interview_date ? (
                              <p className="text-[10px] text-accent-400 flex items-center gap-1 font-medium bg-accent-500/10 px-2 py-0.5 rounded-full">
                                <Calendar className="w-3 h-3" /> {new Date(app.interview_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </p>
                            ) : app.applied_date ? (
                              <p className="text-[10px] text-brand-400 flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3" /> {new Date(app.applied_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {colApps.length === 0 && (
                    <div className="h-full flex items-center justify-center flex-col text-center opacity-40 py-10">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-ink-600 mb-3 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-ink-500" />
                      </div>
                      <span className="text-sm font-medium text-ink-400">Drop here</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
