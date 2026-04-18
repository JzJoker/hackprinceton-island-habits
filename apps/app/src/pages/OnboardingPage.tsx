import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import KnotapiJS from 'knotapi-js'

type SessionResponse = {
  session: string
}

const KnotConstructor = (KnotapiJS as { default?: new () => { open: (options: unknown) => void } }).default ?? (KnotapiJS as unknown as new () => { open: (options: unknown) => void })
const knotapi = new KnotConstructor()
const AMAZON_MERCHANT_ID = 44

export function OnboardingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const backendBaseUrl = useMemo(
    () => import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5001',
    [],
  )
  const knotClientId = useMemo(
    () => import.meta.env.VITE_KNOT_CLIENT_ID ?? '',
    [],
  )
  const knotEnvironment = useMemo(
    () =>
      (import.meta.env.VITE_KNOT_ENVIRONMENT as 'development' | 'production') ??
      'production',
    [],
  )

  const handleConnectMerchants = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!knotClientId) {
        throw new Error('Missing VITE_KNOT_CLIENT_ID for Knot Web SDK.')
      }

      const response = await fetch(`${backendBaseUrl}/api/knot/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(`Session creation failed: ${message}`)
      }

      const data = (await response.json()) as SessionResponse

      knotapi.open({
        sessionId: data.session,
        clientId: knotClientId,
        environment: knotEnvironment,
        entryPoint: 'onboarding',
        customerName: 'aman',
        merchantIds: [AMAZON_MERCHANT_ID],
        onSuccess: (details: unknown) => {
          console.log('onSuccess', details)
        },
        onError: (knotError: unknown) => {
          console.log('onError', knotError)
        },
        onExit: () => {
          console.log('onExit')
        },
        onEvent: (knotEvent: unknown) => {
          console.log('onEvent', knotEvent)
        },
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unexpected onboarding error.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Onboarding
          </h1>
          <p className="text-lg text-slate-300">
            Connect Amazon (merchant code 44) through Knot Transaction Link.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <button
            type="button"
            onClick={handleConnectMerchants}
            disabled={loading}
            className="inline-flex rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Connecting...' : 'Connect Merchants'}
          </button>
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </div>

        <div>
          <Link to="/" className="text-cyan-300 hover:text-cyan-200">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
