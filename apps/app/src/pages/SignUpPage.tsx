import { SignUp, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

export function SignUpPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-10">
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>

      <SignedOut>
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="inline-flex rounded-full border border-black bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-black mb-4">
              Island of Habits
            </div>
            <h1 className="text-3xl font-bold text-black">Create account</h1>
            <p className="mt-2 text-neutral-600 text-sm">
              Sign up with phone OTP.
            </p>
          </div>

          <div className="rounded-2xl border border-black bg-white p-4">
            <SignUp
              path="/signup"
              routing="path"
              forceRedirectUrl="/dashboard"
              signInUrl="/login"
              fallbackRedirectUrl="/dashboard"
              appearance={{
                variables: {
                  colorPrimary: '#111111',
                  colorBackground: '#ffffff',
                  colorInputBackground: '#ffffff',
                  colorText: '#111111',
                  colorInputText: '#111111',
                  colorNeutral: '#111111',
                  colorDanger: '#111111',
                },
              }}
            />
          </div>
        </div>
      </SignedOut>
    </main>
  )
}
