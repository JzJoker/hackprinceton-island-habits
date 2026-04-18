import { useMutation, useQuery } from 'convex/react'
import { useSearchParams } from 'react-router-dom'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardPage() {
  const [searchParams] = useSearchParams()
  const islandIdParam = searchParams.get('islandId')
  const phone = searchParams.get('phone') || ''
  const islandId = islandIdParam as Id<'islands'> | null
  const date = todayIsoDate()

  const islandDetails = useQuery(
    api.islands.getIslandDetails,
    islandId ? { islandId } : 'skip',
  )
  const goals = useQuery(
    api.goals.getGoals,
    islandId && phone ? { islandId, phoneNumber: phone } : 'skip',
  )
  const todayCheckIns = useQuery(
    api.goals.getTodayCheckIns,
    islandId && phone ? { islandId, phoneNumber: phone, date } : 'skip',
  )
  const checkIn = useMutation(api.goals.checkIn)

  const checkedInGoalIds = new Set((todayCheckIns ?? []).map((c) => c.goalId))
  const motivation =
    islandDetails?.agents && islandDetails.agents.length
      ? Math.round(
          islandDetails.agents.reduce((sum, a) => sum + a.motivation, 0) /
            islandDetails.agents.length,
        )
      : 0

  const handleCheckIn = async (goalId: Id<'goals'>) => {
    if (!islandId || !phone || checkedInGoalIds.has(goalId)) {
      return
    }
    await checkIn({
      goalId,
      islandId,
      phoneNumber: phone,
      date,
    })
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your Island
          </h1>
          <p className="text-slate-400">Island ID: {islandId || 'Missing islandId'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs font-medium uppercase text-slate-400">Level</p>
            <p className="mt-2 text-2xl font-bold text-cyan-300">
              {islandDetails?.island.islandLevel ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs font-medium uppercase text-slate-400">XP</p>
            <p className="mt-2 text-2xl font-bold text-cyan-300">
              {islandDetails?.island.xp ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs font-medium uppercase text-slate-400">Currency</p>
            <p className="mt-2 text-2xl font-bold text-cyan-300">
              ⭐{islandDetails?.island.currency ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs font-medium uppercase text-slate-400">Motivation</p>
            <p className="mt-2 text-2xl font-bold text-cyan-300">{motivation}%</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">Today's Goals</h2>
          <div className="space-y-2">
            {(goals ?? []).map((goal) => {
              const completed = checkedInGoalIds.has(goal._id)
              return (
                <button
                  key={goal._id}
                  onClick={() => handleCheckIn(goal._id)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition ${
                    completed
                      ? 'border-cyan-400 bg-cyan-400/10'
                      : 'border-slate-700 bg-slate-900 hover:border-cyan-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={completed ? 'text-cyan-300' : 'text-slate-200'}>
                      {goal.text}
                    </span>
                    <span className="text-xl">{completed ? '✅' : '⭕'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
          <div className="h-96 bg-slate-800 p-4">
            <p className="text-center text-slate-400">
              [Three.js Island Rendering - library installed, scene pending]
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-200 transition hover:bg-slate-700">
            Goals
          </button>
          <button className="flex-1 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-200 transition hover:bg-slate-700">
            Build
          </button>
          <button className="flex-1 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-200 transition hover:bg-slate-700">
            Group
          </button>
        </div>
      </div>
    </main>
  )
}
