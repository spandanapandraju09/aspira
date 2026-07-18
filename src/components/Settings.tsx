import { useState, useEffect } from 'react'
import { Card, Button, Input } from './ui'
import { Settings as SettingsIcon, Key, Save, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function Settings() {
  const [geminiKey, setGeminiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key')
    if (key) setGeminiKey(key)
  }, [])

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', geminiKey.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-ink-100 to-ink-400 flex items-center gap-4">
          <SettingsIcon className="w-8 h-8 text-ink-300" />
          Settings
        </h1>
        <p className="text-ink-400 mt-2 text-lg">Manage your application preferences and API keys.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-8 space-y-6 glass relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-brand-500/5 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="relative z-10 flex items-center gap-3 mb-6 border-b border-ink-800/50 pb-4">
            <div className="w-10 h-10 rounded-xl bg-ink-800 flex items-center justify-center text-brand-400 shadow-inner border border-ink-700/50">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Provider Settings</h2>
              <p className="text-sm text-ink-400">Configure your Gemini API key for live AI generation</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">Google Gemini API Key</label>
              <input 
                type="password"
                className="input-field bg-ink-900/50" 
                value={geminiKey} 
                onChange={(e) => setGeminiKey(e.target.value)} 
                placeholder="AIzaSy..." 
              />
              <p className="text-xs text-ink-500 mt-2">
                Your key is stored securely in your browser's local storage and is never sent to our servers.
                You can get a free key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">Google AI Studio</a>.
              </p>
            </div>

            <Button onClick={handleSave} variant="primary" type="button">
                {saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saved ? 'Saved!' : 'Save Settings'}
              </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
