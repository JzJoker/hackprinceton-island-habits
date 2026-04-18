import { useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5001'

interface JobResult {
  ok: boolean
  [key: string]: unknown
}

interface Job {
  label: string
  endpoint: string
  description: string
}

const JOBS: Job[] = [
  {
    label: 'Send Morning Reminders',
    endpoint: '/jobs/morning-reminder',
    description: 'Sends personalized iMessage reminders to all active players via Photon.',
  },
  {
    label: 'Run Miss Checker',
    endpoint: '/jobs/end-of-day-miss',
    description: 'Marks unchecked goals as missed, decrements agent motivation, damages buildings.',
  },
  {
    label: 'Tick Build Progress',
    endpoint: '/jobs/build-progress-tick',
    description: 'Advances all in-progress construction based on average agent motivation.',
  },
  {
    label: 'Send Weekly Summary',
    endpoint: '/jobs/weekly-summary',
    description: 'Generates a K2 narrative summary for each island and sends it to the group chat.',
  },
]

function JobButton({ job }: { job: Job }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<JobResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function trigger() {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}${job.endpoint}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 flex flex-col gap-3">
      <div>
        <p className="font-semibold text-white">{job.label}</p>
        <p className="text-sm text-slate-400 mt-1">{job.description}</p>
      </div>

      <button
        onClick={trigger}
        disabled={loading}
        className="self-start rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading && (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        )}
        {loading ? 'Running…' : 'Run Now'}
      </button>

      {result && (
        <div className="rounded-lg bg-green-950 border border-green-700 px-4 py-2 text-sm text-green-300 font-mono">
          {JSON.stringify(result)}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-950 border border-red-700 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}

export function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex max-w-xl flex-col gap-8">
        <div>
          <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-200">
            Admin
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Job Triggers</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Manually trigger backend jobs for demo purposes.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {JOBS.map((job) => (
            <JobButton key={job.endpoint} job={job} />
          ))}
        </div>
      </div>
    </main>
  )
}
