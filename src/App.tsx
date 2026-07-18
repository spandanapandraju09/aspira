import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { AuthScreen } from './components/AuthScreen'
import { AppShell } from './components/AppShell'
import { Dashboard } from './components/Dashboard'
import { ProfileEditor } from './components/ProfileEditor'
import { JobAnalyzer } from './components/JobAnalyzer'
import { Tracker } from './components/Tracker'
import { SkillGaps } from './components/SkillGaps'
import { Documents } from './components/Documents'
import { CareerRoadmap } from './components/CareerRoadmap'
import { MockInterview } from './components/MockInterview'
import { PortfolioGenerator } from './components/PortfolioGenerator'
import { Settings } from './components/Settings'
import { Spinner } from './components/ui'

// We will add more routes as we build new features
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'profile', element: <ProfileEditor /> },
      { path: 'analyzer', element: <JobAnalyzer /> },
      { path: 'tracker', element: <Tracker /> },
      { path: 'gaps', element: <SkillGaps /> },
      { path: 'roadmap', element: <CareerRoadmap /> },
      { path: 'interview', element: <MockInterview /> },
      { path: 'portfolio', element: <PortfolioGenerator /> },
      { path: 'documents', element: <Documents /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ],
  },
])

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <Spinner className="text-brand-500 w-8 h-8" />
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return <RouterProvider router={router} />
}
