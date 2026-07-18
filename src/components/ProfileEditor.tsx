import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MasterProfile, Education, Experience, Certification } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Button, Card, Input, Textarea, Badge, Spinner } from './ui'
import { User, Briefcase, GraduationCap, Award, Trash2, Plus, Save, CheckCircle2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ProfileEditor() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Local editable state
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [summary, setSummary] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [education, setEducation] = useState<Education[]>([])
  const [experience, setExperience] = useState<Experience[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    const { data } = await supabase.from('master_profiles').select('*').maybeSingle()
    if (data) {
      const p = data as MasterProfile
      setProfile(p)
      setFullName(p.full_name || '')
      setHeadline(p.headline || '')
      setEmail(p.email || '')
      setPhone(p.phone || '')
      setLocation(p.location || '')
      setSummary(p.summary || '')
      setSkills(p.skills || [])
      setEducation(p.education || [])
      setExperience(p.experience || [])
      setCertifications(p.certifications || [])
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const payload = {
      full_name: fullName,
      headline,
      email,
      phone,
      location,
      summary,
      skills,
      education,
      experience,
      certifications,
      updated_at: new Date().toISOString(),
    }

    if (profile?.id) {
      await supabase.from('master_profiles').update(payload).eq('id', profile.id)
    } else {
      await supabase.from('master_profiles').insert({ ...payload, user_id: user?.id })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setSkillInput('')
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
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sticky top-0 bg-ink-950/80 backdrop-blur-xl z-50 py-4 border-b border-ink-800/50">
        <div>
          <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-ink-100 to-ink-400">Master Profile</h1>
          <p className="text-ink-400 mt-2 text-lg">Your single source of truth for all AI-tailored applications</p>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-sm font-medium text-brand-400 bg-brand-500/10 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4" /> Saved Successfully
              </motion.span>
            )}
          </AnimatePresence>
          <Button onClick={handleSave} loading={saving} className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 shadow-lg shadow-brand-500/20">
            <Save className="w-4 h-4 mr-2" /> Save Profile
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card className="p-8 space-y-6 glass relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-32 bg-brand-500/5 blur-[100px] pointer-events-none rounded-full group-hover:bg-brand-500/10 transition-colors duration-700" />
          <h2 className="text-xl font-bold text-ink-100 flex items-center gap-2 relative z-10">
            <User className="w-6 h-6 text-brand-400" /> Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="bg-ink-900/50" />
            <Input label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Senior Software Engineer" className="bg-ink-900/50" />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" className="bg-ink-900/50" />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0100" className="bg-ink-900/50" />
            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="San Francisco, CA" className="bg-ink-900/50" />
          </div>
          <div className="relative z-10">
            <Textarea label="Professional Summary" rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A brief summary of your professional background and career goals..." className="bg-ink-900/50" />
          </div>
        </Card>

        {/* Skills */}
        <Card className="p-8 space-y-6 glass relative overflow-hidden group">
          <div className="absolute top-0 left-0 p-32 bg-accent-500/5 blur-[100px] pointer-events-none rounded-full group-hover:bg-accent-500/10 transition-colors duration-700" />
          <h2 className="text-xl font-bold text-ink-100 flex items-center gap-2 relative z-10">
            <Award className="w-6 h-6 text-accent-400" /> Core Skills
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 relative z-10">
            <div className="flex-1">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                placeholder="Type a skill (e.g. React, Python) and press Enter"
                className="bg-ink-900/50"
              />
            </div>
            <Button variant="secondary" onClick={addSkill} className="shrink-0 mt-6 sm:mt-0">
              <Plus className="w-4 h-4 mr-2" /> Add Skill
            </Button>
          </div>
          <div className="flex flex-wrap gap-2.5 relative z-10">
            <AnimatePresence>
              {skills.map((skill) => (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  key={skill} 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-800/50 text-ink-200 border border-ink-700/50 text-sm font-medium hover:border-brand-500/30 transition-colors group/skill"
                >
                  {skill}
                  <button onClick={() => setSkills(skills.filter((s) => s !== skill))} className="text-ink-500 hover:text-red-400 focus:outline-none bg-ink-900/50 group-hover/skill:bg-red-500/10 rounded-full p-0.5 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            {skills.length === 0 && <p className="text-sm text-ink-500 italic py-2">No skills added yet. Add skills to improve AI matching accuracy.</p>}
          </div>
        </Card>

        {/* Experience */}
        <Card className="p-8 space-y-6 glass">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800/50 pb-4">
            <h2 className="text-xl font-bold text-ink-100 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-brand-400" /> Work Experience
            </h2>
            <Button variant="secondary" size="sm" onClick={() => setExperience([...experience, { role: '', company: '', duration: '', description: '' }])}>
              <Plus className="w-4 h-4 mr-2" /> Add Experience
            </Button>
          </div>
          
          <AnimatePresence>
            {experience.map((exp, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={i} className="p-6 rounded-2xl bg-ink-900/40 border border-ink-700/30 space-y-5 relative group/item">
                <div className="flex justify-between items-center mb-2">
                  <Badge className="bg-ink-800 text-ink-300">Experience {i + 1}</Badge>
                  <button onClick={() => setExperience(experience.filter((_, idx) => idx !== i))} className="p-2 text-ink-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input value={exp.role} onChange={(e) => { const c = [...experience]; c[i] = { ...exp, role: e.target.value }; setExperience(c) }} placeholder="Role (e.g. Senior Dev)" className="bg-ink-950/50" />
                  <Input value={exp.company} onChange={(e) => { const c = [...experience]; c[i] = { ...exp, company: e.target.value }; setExperience(c) }} placeholder="Company" className="bg-ink-950/50" />
                  <Input value={exp.duration} onChange={(e) => { const c = [...experience]; c[i] = { ...exp, duration: e.target.value }; setExperience(c) }} placeholder="e.g. 2020 - Present" className="bg-ink-950/50" />
                </div>
                <Textarea rows={3} value={exp.description} onChange={(e) => { const c = [...experience]; c[i] = { ...exp, description: e.target.value }; setExperience(c) }} placeholder="Detail your key achievements and responsibilities..." className="bg-ink-950/50" />
              </motion.div>
            ))}
          </AnimatePresence>
          {experience.length === 0 && <p className="text-sm text-ink-500 italic text-center py-4">No experience entries yet.</p>}
        </Card>

        {/* Education */}
        <Card className="p-8 space-y-6 glass">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800/50 pb-4">
            <h2 className="text-xl font-bold text-ink-100 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-accent-400" /> Education
            </h2>
            <Button variant="secondary" size="sm" onClick={() => setEducation([...education, { degree: '', institution: '', year: '', details: '' }])}>
              <Plus className="w-4 h-4 mr-2" /> Add Education
            </Button>
          </div>
          
          <AnimatePresence>
            {education.map((edu, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={i} className="p-6 rounded-2xl bg-ink-900/40 border border-ink-700/30 space-y-5">
                <div className="flex justify-between items-center mb-2">
                  <Badge className="bg-ink-800 text-ink-300">Education {i + 1}</Badge>
                  <button onClick={() => setEducation(education.filter((_, idx) => idx !== i))} className="p-2 text-ink-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input value={edu.degree} onChange={(e) => { const c = [...education]; c[i] = { ...edu, degree: e.target.value }; setEducation(c) }} placeholder="Degree (e.g. B.S. CS)" className="bg-ink-950/50" />
                  <Input value={edu.institution} onChange={(e) => { const c = [...education]; c[i] = { ...edu, institution: e.target.value }; setEducation(c) }} placeholder="University/Institution" className="bg-ink-950/50" />
                  <Input value={edu.year} onChange={(e) => { const c = [...education]; c[i] = { ...edu, year: e.target.value }; setEducation(c) }} placeholder="Year of Graduation" className="bg-ink-950/50" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {education.length === 0 && <p className="text-sm text-ink-500 italic text-center py-4">No education entries yet.</p>}
        </Card>

        {/* Certifications */}
        <Card className="p-8 space-y-6 glass">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800/50 pb-4">
            <h2 className="text-xl font-bold text-ink-100 flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-400" /> Certifications
            </h2>
            <Button variant="secondary" size="sm" onClick={() => setCertifications([...certifications, { name: '', issuer: '', year: '' }])}>
              <Plus className="w-4 h-4 mr-2" /> Add Certification
            </Button>
          </div>
          
          <AnimatePresence>
            {certifications.map((cert, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={i} className="p-6 rounded-2xl bg-ink-900/40 border border-ink-700/30 space-y-5">
                <div className="flex justify-between items-center mb-2">
                  <Badge className="bg-ink-800 text-ink-300">Certification {i + 1}</Badge>
                  <button onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))} className="p-2 text-ink-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input value={cert.name} onChange={(e) => { const c = [...certifications]; c[i] = { ...cert, name: e.target.value }; setCertifications(c) }} placeholder="Certification Name" className="bg-ink-950/50" />
                  <Input value={cert.issuer} onChange={(e) => { const c = [...certifications]; c[i] = { ...cert, issuer: e.target.value }; setCertifications(c) }} placeholder="Issuing Organization" className="bg-ink-950/50" />
                  <Input value={cert.year} onChange={(e) => { const c = [...certifications]; c[i] = { ...cert, year: e.target.value }; setCertifications(c) }} placeholder="Year Earned" className="bg-ink-950/50" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {certifications.length === 0 && <p className="text-sm text-ink-500 italic text-center py-4">No certifications added yet.</p>}
        </Card>
      </div>
    </div>
  )
}
