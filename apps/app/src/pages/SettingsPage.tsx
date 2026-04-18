import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import KnotapiJS from 'knotapi-js'

const MERCHANT_ID = 19
const KnotCtor =
  (KnotapiJS as { default?: new () => { open: (options: unknown) => void } })
    .default ??
  (KnotapiJS as unknown as new () => { open: (options: unknown) => void })
const knotapi = new KnotCtor()

type SessionResponse = { session: string }

export function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { signOut } = useClerk()

  const [connectingMerchants, setConnectingMerchants] = useState(false)
  const [merchantConnected, setMerchantConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnectMerchants = async () => {
    const backendBaseUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5001'
    const knotClientId = import.meta.env.VITE_KNOT_CLIENT_ID ?? ''
    const knotEnvironment =
      (import.meta.env.VITE_KNOT_ENVIRONMENT as 'development' | 'production') ??
      'production'

    setError(null)
    setConnectingMerchants(true)
    try {
      if (!knotClientId) {
        throw new Error('Missing VITE_KNOT_CLIENT_ID in frontend env.')
      }

      const response = await fetch(`${backendBaseUrl}/api/knot/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as SessionResponse

      knotapi.open({
        sessionId: data.session,
        clientId: knotClientId,
        environment: knotEnvironment,
        entryPoint: 'settings',
        merchantIds: [MERCHANT_ID],
        useCategories: false,
        useSearch: false,
        onSuccess: (details: unknown) => {
          setMerchantConnected(true)
          console.log('onSuccess', details)
        },
        onError: (errorCode: string, errorDescription: string) => {
          console.error('onError', errorCode, errorDescription)
          setError(`${errorCode}: ${errorDescription}`)
        },
        onEvent: (
          event: string,
          merchant: string,
          merchantId: number,
          payload: unknown,
          taskId: string,
        ) => {
          console.log('onEvent', event, merchant, merchantId, payload, taskId)
          if (event === 'AUTHENTICATED') {
            setMerchantConnected(true)
          }
        },
        onExit: () => {
          console.log('onExit')
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect merchants.')
    } finally {
      setConnectingMerchants(false)
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-black">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Settings
            </h1>
            <p className="text-neutral-600">Manage your account and connected services</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg border border-black bg-white px-4 py-2 font-semibold text-black transition hover:bg-neutral-100"
          >
            Back
          </button>
        </div>

        {/* Account Section */}
        <div className="rounded-lg border border-black bg-white p-6">
          <h2 className="text-xl font-bold text-black mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-neutral-600">Phone</p>
              <p className="text-base font-semibold text-black">
                {user?.phoneNumbers?.[0]?.phoneNumber ?? 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Name</p>
              <p className="text-base font-semibold text-black">
                {user?.fullName ?? 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Merchants Section */}
        <div className="rounded-lg border border-black bg-white p-6">
          <h2 className="text-xl font-bold text-black mb-4">Connected Services</h2>
          <div className="space-y-4">
            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-black">Amazon Merchant Connection</p>
                  <p className="text-sm text-neutral-600">Link your Amazon account to track spending</p>
                </div>
                <div className={`text-sm font-semibold px-3 py-1 rounded ${merchantConnected ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}`}>
                  {merchantConnected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              <button
                onClick={handleConnectMerchants}
                disabled={connectingMerchants}
                className="w-full rounded-lg border border-black bg-black px-4 py-2 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectingMerchants ? 'Connecting...' : merchantConnected ? 'Reconnect' : 'Connect'}
              </button>
            </div>
            {merchantConnected && (
              <p className="text-sm text-black bg-green-50 border border-green-200 rounded p-3">
                ✓ Merchant connected successfully.
              </p>
            )}
            {error && (
              <p className="text-sm text-black bg-red-50 border border-red-200 rounded p-3">
                Error: {error}
              </p>
            )}
          </div>
        </div>

        {/* Sign Out Section */}
        <div className="rounded-lg border border-black bg-white p-6">
          <h2 className="text-xl font-bold text-black mb-4">Session</h2>
          <button
            onClick={() => signOut()}
            className="w-full rounded-lg border border-black bg-white px-4 py-2 font-semibold text-black transition hover:bg-neutral-100"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  )
}
