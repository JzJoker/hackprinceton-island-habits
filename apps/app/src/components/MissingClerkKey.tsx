export function MissingClerkKey() {
  return (
    <main className="min-h-screen bg-white text-black grid place-items-center p-6">
      <div className="max-w-xl rounded-xl border border-black bg-white p-6">
        <h1 className="mb-2 text-xl font-bold">Missing Clerk Configuration</h1>
        <p className="text-sm text-neutral-700">
          Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in your app env to enable
          phone OTP auth.
        </p>
      </div>
    </main>
  )
}
