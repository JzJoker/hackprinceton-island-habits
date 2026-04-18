import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { OnboardingPage } from './pages/OnboardingPage'
import { AdminPage } from './pages/AdminPage'

function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="inline-flex w-fit rounded-full border border-cyan-400/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          HackPrinceton
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Island Habits App
          </h1>
          <p className="text-lg text-slate-300">
            Onboarding is ready with Knot Transaction Link.
          </p>
        </div>
        <div>
          <Link
            to="/onboarding"
            className="inline-flex rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-300"
          >
            Go To Onboarding
          </Link>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
