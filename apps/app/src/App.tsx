function App() {
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
            React + Vite + TypeScript + Tailwind is ready. Start building your
            habit flow in <code className="rounded bg-slate-900 px-1.5 py-0.5">src/App.tsx</code>.
          </p>
        </div>
        <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
              Frontend
            </h2>
            <p className="mt-2 text-lg font-medium text-cyan-200">apps/app</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
              Agent
            </h2>
            <p className="mt-2 text-lg font-medium text-emerald-200">apps/agent</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
