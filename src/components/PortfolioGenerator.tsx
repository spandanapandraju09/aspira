import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MasterProfile } from '../lib/supabase'
import { Card, Button, Spinner } from './ui'
import { Layout, Globe, Copy, ExternalLink, Download, MonitorSmartphone } from 'lucide-react'
import { motion } from 'framer-motion'

export function PortfolioGenerator() {
  const [profile, setProfile] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('master_profiles').select('*').maybeSingle()
    setProfile(data as MasterProfile | null)
    setLoading(false)
  }

  const handleGenerate = () => {
    setLoading(true)
    setTimeout(() => {
      setGenerated(true)
      setLoading(false)
    }, 1500)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://aspira.ai/portfolio/${profile?.id || 'demo'}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading && !generated) {
    return (
      <div className="flex items-center justify-center py-40">
        <Spinner className="text-brand-500 w-10 h-10" />
      </div>
    )
  }

  if (!generated) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto text-center py-12">
        <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-brand-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/20 mb-8">
          <Globe className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-ink-100 to-ink-400">
          Portfolio Generator
        </h1>
        <p className="text-ink-400 text-lg max-w-2xl mx-auto">
          Turn your Master Profile into a stunning, responsive, and SEO-optimized portfolio website with a single click. 
          Stand out to recruiters with a professional web presence.
        </p>
        <div className="pt-8">
          <Button onClick={handleGenerate} size="lg" disabled={!profile?.full_name} className="bg-white text-ink-950 hover:bg-ink-100">
            <Layout className="w-5 h-5 mr-2" /> Generate My Portfolio
          </Button>
          {!profile?.full_name && <p className="text-sm text-ink-500 mt-4">Please fill out your Master Profile first.</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2">
            <MonitorSmartphone className="w-6 h-6 text-brand-400" /> Portfolio Preview
          </h1>
          <p className="text-ink-400 text-sm">Your portfolio is ready to be shared with the world.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleCopy}>
            {copied ? <span className="text-green-400 flex items-center gap-2"><Copy className="w-4 h-4" /> Copied!</span> : <><Copy className="w-4 h-4 mr-2" /> Copy Link</>}
          </Button>
          <Button className="bg-brand-500 hover:bg-brand-600">
            <Download className="w-4 h-4 mr-2" /> Export Code
          </Button>
        </div>
      </div>

      {/* Mock Browser Window */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl overflow-hidden border border-ink-800 shadow-2xl">
        {/* Browser Header */}
        <div className="bg-ink-900 px-4 py-3 flex items-center gap-4 border-b border-ink-800">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 bg-ink-950 rounded-md px-3 py-1.5 text-xs text-ink-400 flex items-center gap-2 justify-center font-mono">
            https://aspira.ai/portfolio/{profile?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'demo'}
          </div>
          <ExternalLink className="w-4 h-4 text-ink-500" />
        </div>

        {/* Portfolio Content Preview */}
        <div className="bg-white text-slate-900 w-full h-[600px] overflow-y-auto">
          {/* Hero Section */}
          <div className="bg-slate-50 py-24 px-8 text-center border-b border-slate-200">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-6">{profile?.full_name || 'Jane Doe'}</h1>
            <p className="text-2xl text-slate-600 max-w-2xl mx-auto">{profile?.headline || 'Creative Professional'}</p>
            <div className="mt-8">
              <a href="mailto:contact@example.com" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors">
                Get in Touch
              </a>
            </div>
          </div>

          {/* About Section */}
          <div className="py-16 px-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">About Me</h2>
            <p className="text-lg text-slate-600 leading-relaxed text-center">
              {profile?.summary || 'A passionate professional dedicated to building high-quality solutions.'}
            </p>
          </div>

          {/* Skills Section */}
          <div className="py-16 px-8 bg-slate-50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-10 text-center">Skills & Expertise</h2>
              <div className="flex flex-wrap gap-3 justify-center">
                {(profile?.skills || ['React', 'TypeScript', 'Node.js', 'Design', 'Strategy']).map((skill, i) => (
                  <span key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm font-medium text-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Experience Section */}
          <div className="py-16 px-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-10 text-center">Experience</h2>
            <div className="space-y-8">
              {(profile?.experience || [{ title: 'Senior Role', company: 'Tech Inc', duration: '2020 - Present' }]).map((exp: any, i) => (
                <div key={i} className="border-l-2 border-slate-200 pl-6 relative">
                  <div className="absolute w-3 h-3 bg-slate-900 rounded-full -left-[7px] top-2" />
                  <h3 className="text-xl font-bold text-slate-900">{exp.title}</h3>
                  <p className="text-slate-600 font-medium mb-2">{exp.company} • {exp.duration}</p>
                  <p className="text-slate-500">{exp.description || 'Led cross-functional teams to deliver scalable solutions.'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
