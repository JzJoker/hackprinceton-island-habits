import { useState } from 'react'
import { useConvex, useMutation, useQuery } from 'convex/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import { usePhoneNumber } from '../hooks/usePhoneNumber'

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const islandIdParam = searchParams.get('islandId')
  const phone = usePhoneNumber()
  const islandId = islandIdParam as Id<'islands'> | null
  const date = todayIsoDate()

  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [showJoinDialog, setShowJoinDialog] = useState(false)

  const { user } = useUser()
  const convex = useConvex()
  const userEmail = (user?.unsafeMetadata?.icloudEmail as string) ?? null

  const islandsByPhone = useQuery(
    api.islands.getIslandsByPhone,
    phone ? { phoneNumber: phone } : 'skip'
  )
  const islandsByEmail = useQuery(
    api.islands.getIslandsByPhone,
    userEmail ? { phoneNumber: userEmail } : 'skip'
  )

  // Combine results from both queries, removing duplicates
  const islands = Array.from(
    new Map(
      [...(islandsByPhone ?? []), ...(islandsByEmail ?? [])]
        .map((island) => [island._id, island])
    ).values()
  )
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
  const joinIslandMut = useMutation(api.islands.joinIsland)

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

  const handleJoinIsland = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedCode = joinCode.trim().toUpperCase()
    if (!normalizedCode) {
      setJoinError('Please enter a game code.')
      return
    }

    if (!/^[A-Z0-9]{4,6}$/.test(normalizedCode)) {
      setJoinError('Code must be 4-6 letters or numbers.')
      return
    }

    if (!phone) {
      setJoinError('Phone number not found.')
      return
    }

    setJoinLoading(true)
    setJoinError(null)
    try {
      const island = await convex.query(api.islands.getIslandByCode, { code: normalizedCode })
      if (!island) {
        throw new Error('Island code not found.')
      }
      await joinIslandMut({ islandId: island._id, phoneNumber: phone })
      setJoinCode('')
      setShowJoinDialog(false)
      navigate(`/dashboard?islandId=${island._id}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join island')
    } finally {
      setJoinLoading(false)
    }
  }

  const selectedIsland = islands?.find(i => i._id === islandId)

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-black">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header with islands list and action buttons */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              {selectedIsland ? selectedIsland.name : 'Your Islands'}
            </h1>
            <p className="text-neutral-600">
              {islands && islands.length > 0
                ? `${islands.length} island${islands.length !== 1 ? 's' : ''}`
                : 'No islands yet'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="rounded-lg border border-black bg-white px-4 py-2 font-semibold text-black transition hover:bg-neutral-100"
            >
              Settings
            </button>
            <button
              onClick={() => setShowJoinDialog(true)}
              className="rounded-lg border border-black bg-black px-4 py-2 font-semibold text-white transition hover:bg-neutral-800"
            >
              + Join Island
            </button>
          </div>
        </div>

        {/* Islands list */}
        {islands && islands.length > 0 && (
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {islands.map((island) => (
              <button
                key={island._id}
                onClick={() => navigate(`/dashboard?islandId=${island._id}`)}
                className={`rounded-lg border-2 p-3 text-left transition ${
                  island._id === islandId
                    ? 'border-black bg-neutral-100'
                    : 'border-black bg-white hover:bg-neutral-50'
                }`}
              >
                <p className="font-semibold text-black text-sm">{island.name}</p>
                <p className="text-xs text-neutral-600">Lvl {island.islandLevel}</p>
              </button>
            ))}
          </div>
        )}

        {/* Join dialog */}
        {showJoinDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg border border-black p-6 w-full max-w-sm">
              <h2 className="text-2xl font-bold text-black mb-4">Join Island</h2>
              <form onSubmit={handleJoinIsland} className="space-y-4">
                <div>
                  <label htmlFor="joinCode" className="block text-sm font-medium text-black mb-2">
                    Game Code
                  </label>
                  <input
                    id="joinCode"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g., A1B2C3"
                    maxLength={6}
                    className="w-full rounded-lg border border-black bg-white px-4 py-2 text-black placeholder-neutral-500 focus:border-black focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-neutral-600">Enter the 4-6 character code shared by the island creator.</p>
                </div>
                {joinError && <p className="text-sm text-black">{joinError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={joinLoading}
                    className="flex-1 rounded-lg bg-black px-4 py-2 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joinLoading ? 'Joining...' : 'Join'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinDialog(false)
                      setJoinCode('')
                      setJoinError(null)
                    }}
                    className="flex-1 rounded-lg border border-black bg-white px-4 py-2 font-semibold text-black transition hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {islandId && islandDetails && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-black bg-white p-4">
              <p className="text-xs font-medium uppercase text-neutral-600">Level</p>
              <p className="mt-2 text-2xl font-bold text-black">
                {islandDetails.island.islandLevel ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-black bg-white p-4">
              <p className="text-xs font-medium uppercase text-neutral-600">XP</p>
              <p className="mt-2 text-2xl font-bold text-black">
                {islandDetails.island.xp ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-black bg-white p-4">
              <p className="text-xs font-medium uppercase text-neutral-600">Currency</p>
              <p className="mt-2 text-2xl font-bold text-black">
                ⭐{islandDetails.island.currency ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-black bg-white p-4">
              <p className="text-xs font-medium uppercase text-neutral-600">Motivation</p>
              <p className="mt-2 text-2xl font-bold text-black">{motivation}%</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
