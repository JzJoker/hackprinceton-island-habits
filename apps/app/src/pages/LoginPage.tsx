import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5001'

type Step = 'phone' | 'otp'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      setStep('otp')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      login(data.token, data.userId, phone)
      navigate('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <div className="inline-flex rounded-full border border-cyan-400/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200 mb-4">
            Island of Habits
          </div>
          <h1 className="text-3xl font-bold text-white">
            {step === 'phone' ? 'Enter your number' : 'Check your iMessage'}
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            {step === 'phone'
              ? "We'll send a code to your iMessage."
              : `We sent a 6-digit code to ${phone}.`}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <input
              type="tel"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full rounded-xl bg-cyan-500 py-3 font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              )}
              {loading ? 'Sending…' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-xl bg-cyan-500 py-3 font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              )}
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setCode(''); setError(null) }}
              className="text-sm text-slate-500 hover:text-slate-300 text-center"
            >
              Use a different number
            </button>
          </form>
        )}

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}
      </div>
    </main>
  )
}
