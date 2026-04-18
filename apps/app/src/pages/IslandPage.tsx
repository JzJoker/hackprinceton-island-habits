import { useMemo, Suspense, useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQuery, useMutation } from 'convex/react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { GameWindow } from '@/components/game/GameWindow'
import { GameProvider, useGame } from '@/game/state'
import type { Agent, Building, BuildingType, DistrictId, GameBootstrapData, Goal } from '@/game/state'
import { usePhoneNumber } from '@/hooks/usePhoneNumber'
import a1 from '@/assets/agent-1.png'
import a2 from '@/assets/agent-2.png'
import a3 from '@/assets/agent-3.png'
import a4 from '@/assets/agent-4.png'
import a5 from '@/assets/agent-5.png'
import '@/styles/islandHarmony.css'

const AGENT_IMAGES = [a1, a2, a3, a4, a5]
const HOME_POINTS: [number, number][] = [
  [0.5, -1.2],
  [-2.5, -0.5],
  [2.0, 1.5],
  [-1.0, 2.0],
  [1.5, -2.0],
  [-3.2, 1.8],
  [3.2, -1.7],
  [0.2, 2.8],
]

const STYLE_PALETTES = [
  { skin: '#F4D7B5', shirt: '#7AC5A0', pants: '#3A4A6B', hair: '#3B2820', hairStyle: 'long' as const },
  { skin: '#E8C29A', shirt: '#6FA8DC', pants: '#2A3550', hair: '#1F1410', hairStyle: 'cap' as const },
  { skin: '#EFC9A0', shirt: '#E58F7B', pants: '#3A2A40', hair: '#0F0A08', hairStyle: 'bun' as const },
  { skin: '#D9A878', shirt: '#F2C46C', pants: '#3A2A1A', hair: '#2A1810', hairStyle: 'short' as const },
  { skin: '#F0D3B0', shirt: '#C9A0E0', pants: '#5A4030', hair: '#5A3820', hairStyle: 'short' as const },
]

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function titleCase(value: string): string {
  if (!value) return value
  return value
    .split(' ')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ')
}

function participantDisplayName(identifier: string, index: number): string {
  if (identifier.includes('@')) {
    const local = identifier.split('@')[0]?.replace(/[._-]+/g, ' ').trim() ?? ''
    if (local) return titleCase(local)
  }

  const digits = identifier.replace(/\D/g, '')
  if (digits.length >= 4) {
    return `Player ${digits.slice(-4)}`
  }

  return `Player ${index + 1}`
}

function mapIslandGoalsToUiGoals(
  goals: {
    _id: Id<'goals'>
    text: string
  }[] | undefined,
  checkedInGoalIds: Set<string>,
): Goal[] {
  if (!goals || goals.length === 0) return []

  return goals.slice(0, 10).map((goal, idx) => ({
    id: goal._id,
    text: goal.text,
    done: checkedInGoalIds.has(goal._id),
    reward: 10 + ((idx % 3) + 1) * 5,
    photo: false,
  }))
}

function buildUiAgents(args: {
  members: { phoneNumber: string }[]
  persistedAgents: { phoneNumber: string; motivation?: number; reminderVariants?: string[] }[]
  islandGoals: { phoneNumber: string; text: string }[] | undefined
  meCandidates: Set<string>
}): Agent[] {
  const goalsByPhone = new Map<string, string[]>()
  for (const goal of args.islandGoals ?? []) {
    if (!goal.phoneNumber || !goal.text) continue
    const existing = goalsByPhone.get(goal.phoneNumber) ?? []
    existing.push(goal.text)
    goalsByPhone.set(goal.phoneNumber, existing)
  }

  const persistedByPhone = new Map(args.persistedAgents.map((agent) => [agent.phoneNumber, agent]))

  return args.members
    .filter((member): member is { phoneNumber: string } => Boolean(member?.phoneNumber))
    .map((member, index) => {
      const id = member.phoneNumber
      const hash = hashString(id)
      const palette = STYLE_PALETTES[hash % STYLE_PALETTES.length]
      const image = AGENT_IMAGES[hash % AGENT_IMAGES.length]
      const savedAgent = persistedByPhone.get(id)
      const agentGoal = goalsByPhone.get(id)?.[0] ?? 'Stay consistent'
      const line = savedAgent?.reminderVariants?.[0] ?? `Let's make progress today.`
      const mood = Math.max(0, Math.min(100, savedAgent?.motivation ?? 70))

      return {
        id,
        name: participantDisplayName(id, index),
        img: image,
        skin: palette.skin,
        shirt: palette.shirt,
        pants: palette.pants,
        hair: palette.hair,
        hairStyle: palette.hairStyle,
        mood,
        line,
        goal: agentGoal,
        online: true,
        isYou: args.meCandidates.has(id),
        home: HOME_POINTS[index % HOME_POINTS.length],
      }
    })
}

function BuildProgressSync({ islandId }: { islandId: Id<'islands'> }) {
  const { buildings, groupMotivation } = useGame()
  const tickProgress = useMutation(api.buildings.tickBuildProgress)
  const buildingsRef = useRef(buildings)
  const motivationRef = useRef(groupMotivation)
  buildingsRef.current = buildings
  motivationRef.current = groupMotivation

  useEffect(() => {
    const tick = () => {
      if (!buildingsRef.current.some((b) => b.buildProgress < 1)) return
      tickProgress({ islandId, motivationFactor: motivationRef.current }).catch(console.error)
    }
    tick() // fire immediately on mount
    const id = setInterval(tick, 5_000)
    return () => clearInterval(id)
  }, [islandId, tickProgress]) // stable deps — one interval per island

  return null
}

function ConvexSyncBridge({ islandId }: { islandId: Id<'islands'> }) {
  const { syncFromConvex, phoneNumber } = useGame()
  const islandDetails = useQuery(api.islands.getIslandDetails, { islandId })
  const islandBuildings = useQuery(api.buildings.getBuildings, { islandId })
  const islandGoals = useQuery(api.goals.getIslandGoals, { islandId })
  const dailyCheckIns = useQuery(
    api.goals.getIslandCheckInsByDate,
    { islandId, date: new Date().toISOString().slice(0, 10) },
  )

  useEffect(() => {
    if (!islandDetails?.island) return
    const meCandidates = new Set([phoneNumber].filter((value): value is string => Boolean(value)))
    const level = islandDetails.island.islandLevel ?? 0
    const totalXp = islandDetails.island.xp ?? 0
    const progressInLevel = Math.max(0, totalXp - level * 20)
    const xp = Math.min(100, Math.round((progressInLevel / 20) * 100))
    const agents = buildUiAgents({
      members: islandDetails.members,
      persistedAgents: islandDetails.agents,
      islandGoals,
      meCandidates,
    })
    syncFromConvex({
      level,
      xp,
      coins: islandDetails.island.currency ?? 0,
      streak: islandDetails.island.streakDays ?? 0,
      dayCount: islandDetails.island.dayCount ?? 1,
      islandEra: islandDetails.island.era ?? 0,
      serverNowMs: islandDetails.serverNowMs,
      agents,
    })
  }, [islandDetails, islandGoals, phoneNumber, syncFromConvex])

  useEffect(() => {
    if (!islandBuildings) return
    const currentEra = islandDetails?.island?.era ?? 0
    syncFromConvex({
      // Only show buildings placed during the active era — older eras remain
      // in the table so visits can still browse them, but a fresh era must
      // feel like a blank island.
      buildings: islandBuildings
        .filter((b) => (b.placedAtEra ?? 0) === currentEra)
        .map((b) => ({
          id: b._id,
          type: b.type as BuildingType,
          pos: [b.gridX, b.gridY] as [number, number],
          district: 'main' as DistrictId,
          buildProgress: b.buildProgress,
          buildTime: b.buildTimeDays,
          placedAtEra: b.placedAtEra ?? 0,
        })),
    })
  }, [islandBuildings, islandDetails, syncFromConvex])

  useEffect(() => {
    if (!islandGoals) return
    const myGoals = phoneNumber
      ? islandGoals.filter((g) => g.phoneNumber === phoneNumber)
      : islandGoals
    syncFromConvex({
      goals: mapIslandGoalsToUiGoals(
        myGoals,
        new Set((dailyCheckIns ?? []).map((checkIn) => checkIn.goalId)),
      ),
    })
  }, [islandGoals, dailyCheckIns, phoneNumber, syncFromConvex])

  return null
}

export function IslandPage() {
  const [searchParams] = useSearchParams()
  const islandIdParam = searchParams.get('islandId')
  const islandId = islandIdParam as Id<'islands'> | null
  const { user } = useUser()
  const phone = usePhoneNumber()
  const userEmail = (user?.unsafeMetadata?.icloudEmail as string | undefined) ?? null
  const participantIdentity = phone ?? userEmail

  const islandDetails = useQuery(
    api.islands.getIslandDetails,
    islandId ? { islandId } : 'skip',
  )
  const islandGoals = useQuery(
    api.goals.getIslandGoals,
    islandId ? { islandId } : 'skip',
  )
  const islandBuildings = useQuery(
    api.buildings.getBuildings,
    islandId ? { islandId } : 'skip',
  )
  const dailyCheckIns = useQuery(
    api.goals.getIslandCheckInsByDate,
    islandId ? { islandId, date: new Date().toISOString().slice(0, 10) } : 'skip',
  )
  const placeBuildingMut = useMutation(api.buildings.placeBuilding)
  const checkInMut = useMutation(api.goals.checkIn)
  const devGoodDayMut = useMutation(api.dev.goodDay)
  const devBadDayMut = useMutation(api.dev.badDay)
  const devLevelUpMut = useMutation(api.dev.levelUp)
  const graduateEraMut = useMutation(api.islands.graduateEra)

  const bootstrap = useMemo<GameBootstrapData | null>(() => {
    if (!islandDetails || !islandDetails.island) return null
    if (!Array.isArray(islandDetails.members) || !Array.isArray(islandDetails.agents)) {
      console.warn('Invalid island data structure:', { islandDetails })
      return null
    }

    const meCandidates = new Set(
      [phone, userEmail]
        .filter((value): value is string => Boolean(value && value.length > 0)),
    )

    const persistedGoalIds = new Set((islandGoals ?? []).map((goal) => goal._id))
    const agents = buildUiAgents({
      members: islandDetails.members,
      persistedAgents: islandDetails.agents,
      islandGoals,
      meCandidates,
    })

    const level = islandDetails.island.islandLevel ?? 0
    const totalXp = islandDetails.island.xp ?? 0
    const progressInLevel = Math.max(0, totalXp - level * 20)
    const xp = Math.min(100, Math.round((progressInLevel / 20) * 100))

    const currentEra = islandDetails.island.era ?? 0
    const buildings: Building[] = (islandBuildings ?? [])
      .filter((b) => (b.placedAtEra ?? 0) === currentEra)
      .map((b) => ({
        id: b._id,
        type: b.type as BuildingType,
        pos: [b.gridX, b.gridY] as [number, number],
        district: 'main' as DistrictId,
        buildProgress: b.buildProgress,
        buildTime: b.buildTimeDays,
        placedAtEra: b.placedAtEra ?? 0,
      }))

    return {
      islandName: islandDetails.island.name,
      islandId: islandId ?? undefined,
      phoneNumber: participantIdentity ?? undefined,
      level,
      xp,
      coins: islandDetails.island.currency ?? 0,
      streak: islandDetails.island.streakDays ?? 0,
      dayCount: islandDetails.island.dayCount ?? 1,
      islandEra: currentEra,
      serverNowMs: islandDetails.serverNowMs,
      agents,
      goals: mapIslandGoalsToUiGoals(
        participantIdentity
          ? (islandGoals ?? []).filter((g) => g.phoneNumber === participantIdentity)
          : islandGoals,
        new Set((dailyCheckIns ?? []).map((c) => c.goalId)),
      ),
      buildings,
      onBuildingPlaced: (type, x, y, cost, days) => {
        if (!islandId) return Promise.reject(new Error('Missing island id'))
        const placedBy = participantIdentity || 'unknown'
        return placeBuildingMut({
          islandId,
          type,
          gridX: x,
          gridY: y,
          costPaid: cost,
          placedBy,
          buildTimeDays: days,
        })
      },
      onGoalCompleted: (goalId) => {
        if (!islandId || !participantIdentity) {
          return Promise.reject(new Error('Missing island identity for check-in'))
        }
        if (!persistedGoalIds.has(goalId as Id<'goals'>)) {
          return Promise.reject(new Error('Goal is not persisted yet. Please refresh island goals.'))
        }
        return checkInMut({
          goalId: goalId as Id<'goals'>,
          islandId,
          phoneNumber: participantIdentity,
          date: new Date().toISOString().slice(0, 10),
        }).then(() => undefined)
      },
      onDevNextDay: () => {
        if (!islandId) return Promise.reject(new Error('Missing island id'))
        return devGoodDayMut({
          islandId,
          phoneNumber: phone ?? undefined,
          email: userEmail ?? undefined,
        }).then(() => undefined)
      },
      onDevNextDayBad: () => {
        if (!islandId) return Promise.reject(new Error('Missing island id'))
        return devBadDayMut({
          islandId,
          phoneNumber: phone ?? undefined,
          email: userEmail ?? undefined,
        }).then(() => undefined)
      },
      onDevLevelUp: () => {
        if (!islandId) return Promise.reject(new Error('Missing island id'))
        return devLevelUpMut({ islandId }).then(() => undefined)
      },
      onGraduateEra: () => {
        if (!islandId) return Promise.reject(new Error('Missing island id'))
        return graduateEraMut({ islandId }).then(() => undefined)
      },
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [islandDetails, islandGoals, islandBuildings, dailyCheckIns, phone, userEmail, participantIdentity, islandId, checkInMut, placeBuildingMut, devGoodDayMut, devBadDayMut, devLevelUpMut, graduateEraMut])

  if (!islandId) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-6 text-black">
        <div className="max-w-md rounded-lg border border-black p-6 text-center">
          <h1 className="text-xl font-bold">Missing island ID</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Open this page using a valid island link from the dashboard.
          </p>
        </div>
      </main>
    )
  }

  // Handle loading state
  if (islandDetails === undefined || islandGoals === undefined || islandBuildings === undefined) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-6 text-black">
        <div className="max-w-md rounded-lg border border-black p-6 text-center">
          <h1 className="text-xl font-bold">Loading island...</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Fetching players and island state.
          </p>
        </div>
      </main>
    )
  }

  // Handle error state (query returned null/falsy)
  if (!islandDetails) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-6 text-black">
        <div className="max-w-md rounded-lg border border-black p-6 text-center">
          <h1 className="text-xl font-bold">Island not found</h1>
          <p className="mt-2 text-sm text-neutral-600">
            The island you're looking for doesn't exist or you don't have access.
          </p>
        </div>
      </main>
    )
  }

  if (!bootstrap) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-6 text-black">
        <div className="max-w-md rounded-lg border border-black p-6 text-center">
          <h1 className="text-xl font-bold">Unable to load game</h1>
          <p className="mt-2 text-sm text-neutral-600">
            There was an issue preparing the game. Please try again.
          </p>
        </div>
      </main>
    )
  }

  return (
    <GameProvider key={islandId} initialData={bootstrap}>
      <ConvexSyncBridge islandId={islandId} />
      <BuildProgressSync islandId={islandId} />
      <div className="island-harmony-root h-screen w-screen overflow-hidden">
        <Suspense fallback={
          <div className="grid h-screen w-screen place-items-center bg-neutral-900 text-white">
            <div className="text-center">
              <div className="mb-4 text-4xl">🌴</div>
              <p className="text-sm text-neutral-400">Preparing your island...</p>
            </div>
          </div>
        }>
          <GameWindow />
        </Suspense>
      </div>
    </GameProvider>
  )
}
