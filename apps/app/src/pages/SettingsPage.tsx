import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import KnotapiJS from 'knotapi-js'

const MERCHANT_ID = 19
const KnotCtor =
  (KnotapiJS as { default?: new () => { open: (options: unknown) => void } })
    .default ??
  (KnotapiJS as unknown as new () => { open: (options: unknown) => void })

type SessionResponse = { session: string }

export function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { signOut } = useClerk()

  const [connectingMerchants, setConnectingMerchants] = useState(false)
  const [merchantConnected, setMerchantConnected] = useState(false)
  const [knotError, setKnotError] = useState<string | null>(null)
  const [editingEmail, setEditingEmail] = useState(false)
  const [emailValue, setEmailValue] = useState(
    (user?.unsafeMetadata?.icloudEmail as string) ?? ''
  )
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleSaveEmail = async () => {
    try {
      setSavingEmail(true)
      setEmailError(null)

      // Validate email format
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        setEmailError('Invalid email format')
        setSavingEmail(false)
        return
      }

      // Update Clerk user metadata
      await user?.update({
        unsafeMetadata: {
          ...(user?.unsafeMetadata || {}),
          icloudEmail: emailValue || null,
        },
      })

      setEmailSaved(true)
      setTimeout(() => setEmailSaved(false), 3000)
      setEditingEmail(false)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to save email')
    } finally {
      setSavingEmail(false)
    }
  }

  const handleConnectMerchants = async () => {
    const backendBaseUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5001'
    const knotClientId = import.meta.env.VITE_KNOT_CLIENT_ID ?? ''
    const knotEnvironment =
      (import.meta.env.VITE_KNOT_ENVIRONMENT as 'development' | 'production') ??
      'production'

    setKnotError(null)
    setConnectingMerchants(true)
    try {
      if (!knotClientId) {
        throw new Error('Missing VITE_KNOT_CLIENT_ID in frontend env.')
      }

      const response = await fetch(`${backendBaseUrl}/api/knot/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as SessionResponse

      // Fresh instance per invocation to avoid stale state
      const knotapi = new KnotCtor()

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
          setConnectingMerchants(false)
          console.log('onSuccess', details)
        },
        onError: (errorCode: string, errorDescription: string) => {
          console.error('onError', errorCode, errorDescription)
          setKnotError(`${errorCode}: ${errorDescription}`)
          setConnectingMerchants(false)
        },
        onEvent: (
          event: string,
          merchant: string,
          payload: unknown,
          taskId: string,
        ) => {
          console.log('onEvent', event, merchant, payload, taskId)
          if (event === 'AUTHENTICATED') {
            setMerchantConnected(true)
          }
        },
        onExit: () => {
          console.log('onExit')
          setConnectingMerchants(false)
        },
      })
    } catch (err) {
      setKnotError(err instanceof Error ? err.message : 'Failed to connect merchants.')
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
          <div className="space-y-4">
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
            <div>
              <p className="text-sm text-neutral-600">iCloud Email (Optional)</p>
              <p className="text-xs text-neutral-500 mb-2">
                Add your iCloud email to be discoverable in games via iMessage
              </p>
              {!editingEmail ? (
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-black">
                    {emailValue || 'Not set'}
                  </p>
                  <button
                    onClick={() => setEditingEmail(true)}
                    className="text-sm text-black hover:text-neutral-600 font-semibold"
                  >
                    {emailValue ? 'Edit' : 'Add'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="you@icloud.com"
                    className="w-full rounded-lg border border-black bg-white px-4 py-2 text-black placeholder-neutral-500 focus:border-black focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEmail}
                      disabled={savingEmail}
                      className="flex-1 rounded-lg bg-black px-4 py-2 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingEmail ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingEmail(false)
                        setEmailError(null)
                        setEmailValue((user?.unsafeMetadata?.icloudEmail as string) ?? '')
                      }}
                      className="flex-1 rounded-lg border border-black bg-white px-4 py-2 font-semibold text-black transition hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                  </div>
                  {emailError && (
                    <p className="text-sm text-black bg-red-50 border border-red-200 rounded p-2">
                      Error: {emailError}
                    </p>
                  )}
                </div>
              )}
              {emailSaved && (
                <p className="text-sm text-black bg-green-50 border border-green-200 rounded p-2 mt-2">
                  ✓ Email saved
                </p>
              )}
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
                  <p className="font-semibold text-black">DoorDash Merchant Connection</p>
                  <p className="text-sm text-neutral-600">Link your DoorDash account to track spending</p>
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
            {knotError && (
              <p className="text-sm text-black bg-red-50 border border-red-200 rounded p-3">
                Error: {knotError}
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
