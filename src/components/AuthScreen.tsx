import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { isDemoMode } from '../lib/supabase'
import { Button, Input } from './ui'
import { Shield, Key, CheckCircle2, QrCode } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'mfa_setup' | 'mfa_challenge'>('signup')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'forgot') {
      const { error: resetError } = await resetPassword(email)
      if (resetError) {
        setError(resetError)
      } else {
        setMessage('Password reset instructions have been sent to your email.')
      }
      setLoading(false)
      return
    }

    if (mode === 'mfa_setup' || mode === 'mfa_challenge') {
      // Simulate MFA Verification
      if (otp.length < 6) {
        setError('Please enter a valid 6-digit code.')
        setLoading(false)
        return
      }
      // If Demo, force sign in
      setTimeout(() => {
        if (isDemoMode) {
          signIn(email, password) // Bypass real auth in demo mode
        } else {
          setError('MFA is not fully configured in your live Supabase project yet.')
        }
        setLoading(false)
      }, 1000)
      return
    }

    // Standard Sign In / Sign Up
    const fn = mode === 'signin' ? signIn : signUp
    const { error: authError } = await fn(email, password)
    
    if (authError) {
      setError(authError)
      setLoading(false)
    } else {
      // If sign in is successful and we want to simulate 2FA, we intercept it here.
      // But useAuth().signIn() actually sets the session and unmounts AuthScreen automatically if successful.
      // For a true 2FA simulation, we'd need to prevent the session from setting until 2FA is done.
      // For now, if we are in Demo Mode, useAuth handles it immediately.
      setLoading(false)
    }
  }

  // Intercept sign-in for Demo Mode MFA simulation
  const handleSimulatedSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDemoMode) {
      // Go to MFA Challenge instead of logging in immediately
      setMode('mfa_challenge')
    } else {
      handleSubmit(e)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-500/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Aspira AI" className="h-16 w-auto object-contain mb-4" />
          <h1 className="text-3xl font-bold font-display text-slate-800">Welcome</h1>
          <p className="text-sm text-slate-500 mt-1">Your AI Career Co-Pilot</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          
          {(mode === 'signin' || mode === 'signup') && (
            <div className="flex gap-1 p-1 bg-white/80 rounded-xl mb-6 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] border border-slate-200">
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signup' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signin' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign In
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form 
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={mode === 'signin' ? handleSimulatedSignIn : handleSubmit} 
              className="space-y-4"
            >
              {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && (
                <Input
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/80"
                />
              )}
              
              {(mode === 'signin' || mode === 'signup') && (
                <div>
                  <Input
                    label="Password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="bg-white/80"
                  />
                  {mode === 'signin' && (
                    <div className="flex justify-end mt-2">
                      <button type="button" onClick={() => setMode('forgot')} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(mode === 'mfa_setup' || mode === 'mfa_challenge') && (
                <div className="flex flex-col items-center text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-2">
                    <Shield className="w-8 h-8 text-brand-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Two-Factor Authentication</h3>
                  <p className="text-sm text-slate-500">
                    {mode === 'mfa_setup' 
                      ? 'Scan the QR code with your authenticator app (like Google Authenticator or Authy) to secure your account.'
                      : 'Enter the 6-digit code from your authenticator app to continue.'}
                  </p>

                  {mode === 'mfa_setup' && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl my-4">
                      <QrCode className="w-32 h-32 text-slate-800" />
                    </div>
                  )}

                  <Input
                    label="Authentication Code"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    className="bg-white/80 text-center tracking-widest text-lg font-mono"
                  />
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 animate-fade-in">
                  {error}
                </div>
              )}

              {message && (
                <div className="text-sm text-pink-700 bg-pink-50 border border-pink-100 rounded-lg px-4 py-2.5 animate-fade-in flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {message}
                </div>
              )}

              <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white" size="lg" loading={loading}>
                {mode === 'signin' ? 'Sign In' : 
                 mode === 'signup' ? 'Create Account' : 
                 mode === 'forgot' ? 'Send Reset Link' : 
                 'Verify Code'}
              </Button>

              {(mode === 'forgot' || mode === 'mfa_setup' || mode === 'mfa_challenge') && (
                <button type="button" onClick={() => setMode('signin')} className="w-full text-sm text-slate-500 hover:text-slate-700 mt-4">
                  Back to Sign In
                </button>
              )}
            </motion.form>
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
