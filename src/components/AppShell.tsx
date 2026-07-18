import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { LayoutDashboard, UserCircle, Briefcase, Kanban, Target, FileText, Settings, LogOut, Compass, Mic, Globe, MapPin, Mail, Phone, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import VisualLayers from './VisualLayers';
import GlassyCard from './GlassyCard';
import { Chatbot } from './Chatbot'

const NAV_ITEMS = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', path: '/profile', label: 'Master Profile', icon: UserCircle },
  { id: 'analyzer', path: '/analyzer', label: 'Job Analyzer', icon: Briefcase },
  { id: 'tracker', path: '/tracker', label: 'Tracker', icon: Kanban },
  { id: 'roadmap', path: '/roadmap', label: 'Roadmap', icon: Compass },
  { id: 'interview', path: '/interview', label: 'Mock Interview', icon: Mic },
  { id: 'portfolio', path: '/portfolio', label: 'Portfolio', icon: Globe },
]

export function AppShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-900 font-sans">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-white/80 shadow-sm px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Aspira AI Logo" className="h-8 w-auto object-contain" />
          <div className="hidden sm:block">
            <h1 className="font-bold font-display text-slate-800 text-lg leading-none">AspiraAI</h1>
            <p className="text-[10px] text-brand-500 font-bold tracking-wider mt-1 uppercase">Premium</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto px-4 hide-scrollbar">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-4">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `p-2 rounded-full transition-all ${isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`
            }
          >
            <Settings className="w-5 h-5" />
          </NavLink>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-500 to-accent-500 text-white flex items-center justify-center text-xs font-bold">
              {(user?.email ?? '?')[0].toUpperCase()}
            </div>
            <p className="text-xs text-slate-700 font-medium max-w-[100px] truncate">{user?.email}</p>
          </div>

          <button
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition-all border border-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative flex flex-col justify-between items-center w-full">
        {/* Background Aurora Effect */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-500/10 blur-[120px] pointer-events-none" />
        
          {/* Visual Layers */}
          <VisualLayers />
          {/* Animated Header Description */}
        <div className="w-full max-w-6xl mx-auto px-6 pt-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-6 shadow-sm flex items-start gap-4 mb-2"
          >
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Your AI Career Co-Pilot</h2>
              <p className="text-slate-600 mt-1">
                Supercharge your job search with intelligent resume tailoring, predictive skill gap analysis, and personalized career roadmaps. 
                Let AI help you land your dream job faster.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Content */}
        <GlassyCard>
          <div className="w-full max-w-6xl px-6 py-8 relative z-10 animate-fade-in mx-auto flex-1">
            <Outlet />
          </div>
        </GlassyCard>

        {/* Footer */}
        <footer className="w-full mt-auto relative z-10 bg-white/50 backdrop-blur-md border-t border-slate-200 py-8">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Aspira AI Logo" className="h-8 w-auto object-contain" />
              <span className="font-bold font-display text-slate-800 text-lg">AspiraAI</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-2 hover:text-brand-600 transition-colors cursor-pointer">
                <MapPin className="w-4 h-4" /> 123 Tech Avenue, Silicon Valley, CA
              </div>
              <div className="flex items-center gap-2 hover:text-brand-600 transition-colors cursor-pointer">
                <Mail className="w-4 h-4" /> support@aspira.ai
              </div>
              <div className="flex items-center gap-2 hover:text-brand-600 transition-colors cursor-pointer">
                <Phone className="w-4 h-4" /> +1 (800) 555-0199
              </div>
            </div>
          </div>
        </footer>
      </main>
      
      {/* Global Chatbot widget */}
      <Chatbot />
    </div>
  )
}
