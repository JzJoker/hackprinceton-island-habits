import { useMemo } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { GameWindow } from '@/components/game/GameWindow'
import { GameProvider } from '@/game/state'
import type { Agent, GameBootstrapData, Goal } from '@/game/state'
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
): Goal[] {
  if (!goals || goals.length === 0) {
    return [
      { id: 'g1', text: 'Morning check-in', done: false, reward: 15 },
      { id: 'g2', text: 'One focused work block', done: false, reward: 20 },
      { id: 'g3', text: 'Move your body', done: false, reward: 15 },
    ]
  }

  return goals.slice(0, 10).map((goal, idx) => ({
    id: goal._id,
    text: goal.text,
    done: false,
    reward: 10 + ((idx % 3) + 1) * 5,
    photo: false,
  }))
}

export function IslandPage() {
  const [searchParams] = useSearchParams()
  const islandIdParam = searchParams.get('islandId')
  const islandId = islandIdParam as Id<'islands'> | null
  const { user } = useUser()
  const phone = usePhoneNumber()

  const islandDetails = useQuery(
    api.islands.getIslandDetails,
    islandId ? { islandId } : 'skip',
  )
  const islandGoals = useQuery(
    api.goals.getIslandGoals,
    islandId ? { islandId } : 'skip',
  )

  const bootstrap = useMemo<GameBootstrapData | null>(() => {
    if (!islandDetails || !islandDetails.island) return null
    if (!Array.isArray(islandDetails.members) || !Array.isArray(islandDetails.agents)) {
      console.warn('Invalid island data structure:', { islandDetails })
      return null
    }

    const meCandidates = new Set(
      [phone, user?.unsafeMetadata?.icloudEmail as string | undefined]
        .filter((value): value is string => Boolean(value && value.length > 0)),
    )

    const goalsByPhone = new Map<string, string[]>()
    for (const goal of islandGoals ?? []) {
      if (!goal.phoneNumber || !goal.text) continue
      const existing = goalsByPhone.get(goal.phoneNumber) ?? []
      existing.push(goal.text)
      goalsByPhone.set(goal.phoneNumber, existing)
    }

    const agents: Agent[] = islandDetails.members
      .filter((member): member is typeof islandDetails.members[0] & { phoneNumber: string } =>
        Boolean(member?.phoneNumber)
      )
      .map((member, index) => {
        const id = member.phoneNumber
        const hash = hashString(id)
        const palette = STYLE_PALETTES[hash % STYLE_PALETTES.length]
        const image = AGENT_IMAGES[hash % AGENT_IMAGES.length]
        const savedAgent = islandDetails.agents.find((agent) => agent?.phoneNumber === member.phoneNumber)
        const agentGoal = goalsByPhone.get(member.phoneNumber)?.[0] ?? 'Stay consistent'
        const line = savedAgent?.reminderVariants?.[0] ?? `Let's make progress today.`
        const mood = Math.max(0, Math.min(100, savedAgent?.motivation ?? 70))

        return {
          id,
          name: participantDisplayName(member.phoneNumber, index),
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
          isYou: meCandidates.has(member.phoneNumber),
          home: HOME_POINTS[index % HOME_POINTS.length],
        }
      })

    const level = islandDetails.island.islandLevel ?? 0
    const totalXp = islandDetails.island.xp ?? 0
    const progressInLevel = Math.max(0, totalXp - level * 20)
    const xp = Math.min(100, Math.round((progressInLevel / 20) * 100))

    return {
      islandName: islandDetails.island.name,
      level,
      xp,
      coins: islandDetails.island.currency ?? 0,
      agents,
      goals: mapIslandGoalsToUiGoals(islandGoals),
    }
  }, [islandDetails, islandGoals, phone, user?.unsafeMetadata?.icloudEmail])

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
  if (islandDetails === undefined || islandGoals === undefined) {
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
