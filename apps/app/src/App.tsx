import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { OnboardingPage } from './pages/OnboardingPage'
import { AdminPage } from './pages/AdminPage'
import { DashboardPage } from './pages/DashboardPage'

function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="inline-flex w-fit rounded-full border border-cyan-400/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          HackPrinceton
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Island Habits
          </h1>
          <p className="text-lg text-slate-300">
            A cooperative island-building game powered by real-life habits.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            to="/onboarding"
            className="inline-flex rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-300"
          >
            Join a Game
          </Link>
          <p className="text-sm text-slate-400">
            Get a game code from your group chat and start your island adventure.
          </p>
        </div>
      </div>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
