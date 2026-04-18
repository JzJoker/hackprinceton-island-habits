import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { api } from '../../convex/_generated/api'
import { usePhoneNumber } from '../hooks/usePhoneNumber'

/* ── Cozy font loader (shared with DashboardPage) ─────── */
function useCozFont() {
  useEffect(() => {
    if (document.getElementById('island-fonts')) return
    const link = document.createElement('link')
    link.id = 'island-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@600;700;800;900&display=swap'
    document.head.appendChild(link)
  }, [])
}

/* ── Design tokens (identical to DashboardPage) ───────── */
const C = {
  bg:         'linear-gradient(180deg, #ecd8bf 0%, #b9e6ea 16%, #9ad3dd 62%, #89c8d6 100%)',
  card:       '#f8f3e6',
  cardBorder: '#d4b587',
  navy:       '#1d3451',
  navy2:      '#273f60',
  text:       '#223856',
  textMuted:  '#6d7b8f',
  textLabel:  '#6c86a4',
  green:      '#54c98a',
  softBlue:   '#dff2f7',
  cream:      '#fffaf0',
}

const fredoka = (size = 20): React.CSSProperties => ({
  fontFamily: "'Fredoka One', cursive",
  fontWeight: 400,
  fontSize: `${size}px`,
  color: C.text,
})

const nunito = (weight = 700, size = 14): React.CSSProperties => ({
  fontFamily: "'Nunito', sans-serif",
  fontWeight: weight,
  fontSize: `${size}px`,
})

const BtnGhost = ({
  children, onClick, style,
}: {
  children: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
}) => (
  <button
    onClick={onClick}
    style={{
      background: '#ffffff',
      border: '2px solid #d4e5ef',
      borderRadius: '16px',
      color: C.navy,
      padding: '10px 16px',
      cursor: 'pointer',
      boxShadow: '0 6px 12px -10px rgba(29,52,81,0.42)',
      transition: 'all 0.15s',
      ...nunito(800, 14),
      ...style,
    }}
  >
    {children}
  </button>
)

const GameBg = () => (
  <>
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: C.bg,
    }} />
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse 82% 46% at 50% 83%, rgba(130,207,220,0.65) 0%, rgba(130,207,220,0.0) 100%)',
    }} />
    {[...Array(7)].map((_, i) => (
      <div key={i} style={{
        position: 'fixed',
        width: 180 + (i % 3) * 110,
        height: 180 + (i % 3) * 110,
        borderRadius: '50%',
        background: i % 2 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(199,236,243,0.34)',
        left: `${(i * 17 + i * i * 5) % 94}%`,
        top: `${2 + (i * 11 + i * 9) % 72}%`,
        opacity: 0.55,
        filter: 'blur(44px)',
        zIndex: 0,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
      }} />
    ))}
  </>
)

/* ── Small helpers ────────────────────────────────────── */
const formatWhen = (ts: number) => {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `today, ${time}`
  const diffDays = Math.floor((now.getTime() - ts) / 86400000)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const prettyAddress = (raw: string) => {
  if (!raw) return 'unknown'
  if (raw.includes('@')) return raw
  if (raw.startsWith('+') && raw.length === 12) {
    return `(${raw.slice(2, 5)}) ${raw.slice(5, 8)}-${raw.slice(8)}`
  }
  return raw
}

/* ── Character trait generator ─────────────────────────
   Mirrors the palette used by Agent3D.tsx so every agent on the /agents
   page shows the same chibi character it would render as on the island.
   Seeded by phoneNumber so a given agent is visually stable.         */
const SKIN_PALETTE   = ['#F4D7B5', '#E8C29A', '#EFC9A0', '#D9A878', '#C48B60']
const SHIRT_PALETTE  = ['#7AC5A0', '#6FA8DC', '#C9A0E0', '#E58F7B', '#F2C46C', '#8DB9D8']
const PANTS_PALETTE  = ['#3A4A6B', '#2A3550', '#5A4030', '#3A2A40', '#3A2A1A', '#4B3A2C']
const HAIR_PALETTE   = ['#3B2820', '#1F1410', '#5A3820', '#0F0A08', '#2A1810', '#7B5A3C']
const HAIR_STYLES    = ['short', 'long', 'bun', 'cap'] as const
type HairStyle = typeof HAIR_STYLES[number]

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function characterTraits(phone: string) {
  const h = hashSeed(phone || 'anon')
  return {
    skin:      SKIN_PALETTE[h % SKIN_PALETTE.length],
    shirt:     SHIRT_PALETTE[(h >>> 3) % SHIRT_PALETTE.length],
    pants:     PANTS_PALETTE[(h >>> 7) % PANTS_PALETTE.length],
    hair:      HAIR_PALETTE[(h >>> 11) % HAIR_PALETTE.length],
    hairStyle: HAIR_STYLES[(h >>> 17) % HAIR_STYLES.length] as HairStyle,
  }
}

/* ── Chibi SVG avatar ─────────────────────────────────── */
const ChibiAvatar = ({
  phone, size = 72,
}: { phone: string; size?: number }) => {
  const t = characterTraits(phone)
  // viewBox is 0..80. Scale to `size`.
  return (
    <svg viewBox="0 0 80 96" width={size} height={(size * 96) / 80} aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="40" cy="90" rx="18" ry="3" fill="#2A3A20" opacity="0.2" />
      {/* Legs */}
      <rect x="30" y="68" width="8" height="18" rx="4" fill={t.pants} />
      <rect x="42" y="68" width="8" height="18" rx="4" fill={t.pants} />
      {/* Shoes */}
      <ellipse cx="34" cy="87" rx="5" ry="2.5" fill="#3A2418" />
      <ellipse cx="46" cy="87" rx="5" ry="2.5" fill="#3A2418" />
      {/* Torso */}
      <ellipse cx="40" cy="58" rx="16" ry="14" fill={t.shirt} />
      {/* Arms */}
      <circle cx="22" cy="54" r="6" fill={t.shirt} />
      <circle cx="22" cy="62" r="4.5" fill={t.skin} />
      <circle cx="58" cy="54" r="6" fill={t.shirt} />
      <circle cx="58" cy="62" r="4.5" fill={t.skin} />
      {/* Neck */}
      <rect x="36" y="40" width="8" height="6" fill={t.skin} />
      {/* Head */}
      <circle cx="40" cy="30" r="16" fill={t.skin} />
      {/* Cheek blush */}
      <circle cx="30" cy="34" r="2.5" fill="#F4A8A8" opacity="0.55" />
      <circle cx="50" cy="34" r="2.5" fill="#F4A8A8" opacity="0.55" />
      {/* Eyes */}
      <circle cx="34" cy="30" r="2.2" fill="#1A1410" />
      <circle cx="46" cy="30" r="2.2" fill="#1A1410" />
      <circle cx="34.6" cy="29.2" r="0.7" fill="#FFFFFF" />
      <circle cx="46.6" cy="29.2" r="0.7" fill="#FFFFFF" />
      {/* Mouth — smile */}
      <path d="M 35 37 Q 40 40 45 37" stroke="#5A3020" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Hair */}
      {t.hairStyle === 'short' && (
        <>
          <path d="M 24 24 Q 40 10 56 24 L 56 30 L 24 30 Z" fill={t.hair} />
          <circle cx="25" cy="28" r="4" fill={t.hair} />
          <circle cx="55" cy="28" r="4" fill={t.hair} />
        </>
      )}
      {t.hairStyle === 'long' && (
        <>
          <path d="M 22 22 Q 40 8 58 22 L 58 32 L 22 32 Z" fill={t.hair} />
          <rect x="23" y="26" width="6" height="22" rx="3" fill={t.hair} />
          <rect x="51" y="26" width="6" height="22" rx="3" fill={t.hair} />
        </>
      )}
      {t.hairStyle === 'bun' && (
        <>
          <path d="M 24 22 Q 40 12 56 22 L 56 30 L 24 30 Z" fill={t.hair} />
          <circle cx="40" cy="13" r="6" fill={t.hair} />
          <rect x="45" y="9" width="1.5" height="8" fill="#C9A55B" transform="rotate(25 45 13)" />
        </>
      )}
      {t.hairStyle === 'cap' && (
        <>
          <path d="M 22 22 Q 40 8 58 22 L 58 28 L 22 28 Z" fill={t.shirt} />
          <rect x="40" y="24" width="22" height="3" rx="1.5" fill={t.shirt} />
          <path d="M 28 32 Q 36 36 40 32 L 40 38 L 28 38 Z" fill={t.hair} />
        </>
      )}
    </svg>
  )
}

const motivationTone = (m: number) => {
  if (m >= 75) return { label: 'thriving',   color: '#3aa56d', bg: '#e4f5ec' }
  if (m >= 50) return { label: 'steady',     color: '#c88a2a', bg: '#fbf0dd' }
  if (m >= 25) return { label: 'struggling', color: '#c86a4a', bg: '#fbe4dc' }
  return        { label: 'slacking',   color: '#9a3a3a', bg: '#f7d9d5' }
}

/* ── Data shapes ──────────────────────────────────────── */
type IslandInfo = {
  _id: string
  name: string
  code: string
  islandLevel: number
  xp: number
}
type AgentInfo = {
  _id: string
  phoneNumber: string
  personalityProfile: string
  motivation: number
  reminderVariants: string[]
  createdAt: number
}
type MemberInfo = {
  _id: string
  islandId: string
  phoneNumber: string
  role: 'creator' | 'member'
  joinedAt: number
}
type MessageInfo = {
  _id: string
  channel: 'imessage_personal' | 'imessage_group'
  content: string
  context?: unknown
  sentAt: number
}
type Character = {
  member: MemberInfo
  agent: AgentInfo | null
  messages: MessageInfo[]
}
type IslandBundle = {
  island: IslandInfo
  characters: Character[]
}

/* ── Per-character card ───────────────────────────────── */
const CharacterCard = ({ island, character }: { island: IslandInfo; character: Character }) => {
  const { member, agent, messages } = character
  const tone = agent ? motivationTone(agent.motivation) : motivationTone(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const spawned = agent !== null

  return (
    <div style={{
      background: 'linear-gradient(160deg, #fffdf8 0%, #f8f4ea 100%)',
      border: `2px solid ${C.cardBorder}`,
      borderRadius: '22px',
      padding: '16px 16px 14px',
      boxShadow: '0 12px 20px -18px rgba(31,67,101,0.55)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
          <div style={{
            width: '72px',
            minWidth: '72px',
            height: '86px',
            borderRadius: '16px',
            background: 'linear-gradient(180deg, #fffaf0 0%, #f5ead2 100%)',
            border: '1.5px solid #ecdcc0',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '2px',
            boxShadow: 'inset 0 -8px 12px -10px rgba(31,67,101,0.25)',
          }}>
            <ChibiAvatar phone={member.phoneNumber} size={68} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ ...nunito(900, 10), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.09em', margin: 0 }}>
              {member.role === 'creator' ? 'Creator' : 'Member'} · Lv {island.islandLevel}
            </p>
            <p style={{ ...fredoka(20), margin: '3px 0 0', color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {prettyAddress(member.phoneNumber)}
            </p>
            <p style={{ ...nunito(700, 11), color: C.textMuted, margin: '2px 0 0' }}>
              Character on {island.name}
            </p>
          </div>
        </div>
        <span style={{
          borderRadius: '999px',
          padding: '4px 10px',
          background: spawned ? tone.bg : '#eef2f8',
          color: spawned ? tone.color : '#6d7b8f',
          ...nunito(900, 10),
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          alignSelf: 'flex-start',
        }}>
          {spawned ? tone.label : 'not spawned'}
        </span>
      </div>

      {/* Character traits */}
      {(() => {
        const t = characterTraits(member.phoneNumber)
        const swatch = (color: string, label: string) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: color, border: '1.5px solid rgba(0,0,0,0.12)',
              display: 'inline-block',
            }} />
            <span style={{ ...nunito(700, 11), color: C.textMuted }}>{label}</span>
          </span>
        )
        return (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 14px',
            padding: '8px 12px',
            background: '#fbf5e6',
            border: '1.5px solid #ecdcc0',
            borderRadius: '14px',
            alignItems: 'center',
          }}>
            {swatch(t.skin, 'skin')}
            {swatch(t.hair, `hair · ${t.hairStyle}`)}
            {swatch(t.shirt, 'shirt')}
            {swatch(t.pants, 'pants')}
          </div>
        )
      })()}

      {!spawned ? (
        <div style={{
          background: '#fffdf5',
          border: '1.5px dashed #d9c8a8',
          borderRadius: '14px',
          padding: '12px 14px',
        }}>
          <p style={{ ...nunito(900, 11), color: C.navy, margin: 0 }}>
            Agent not spawned yet
          </p>
          <p style={{ ...nunito(700, 12), color: C.textMuted, margin: '4px 0 0', lineHeight: 1.4 }}>
            A K2 personality spawns the first time this player adds a goal via iMessage or the island page.
          </p>
        </div>
      ) : (
        <>
          {/* Motivation meter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ ...nunito(800, 11), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Motivation
              </span>
              <span style={{ ...nunito(900, 12), color: C.navy }}>{agent!.motivation}/100</span>
            </div>
            <div style={{
              height: '10px',
              borderRadius: '999px',
              background: '#eaf2fa',
              border: '1px solid #d6e5f2',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.max(0, Math.min(100, agent!.motivation))}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${tone.color} 0%, ${tone.color}cc 100%)`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Personality */}
          <div>
            <p style={{ ...nunito(900, 10), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 4px' }}>
              Personality
            </p>
            <p style={{
              ...nunito(700, 13),
              color: C.text,
              margin: 0,
              lineHeight: 1.45,
              background: '#fffaf0',
              border: '1.5px solid #ecdcc0',
              borderRadius: '14px',
              padding: '10px 12px',
            }}>
              {agent!.personalityProfile || '— no personality generated yet —'}
            </p>
          </div>

      {/* Recent reasoning / messages */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <p style={{ ...nunito(900, 10), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.09em', margin: 0 }}>
            Recent messages
          </p>
          <span style={{ ...nunito(700, 11), color: C.textMuted }}>
            {messages.length} shown
          </span>
        </div>

        {messages.length === 0 ? (
          <div style={{
            ...nunito(700, 12),
            color: C.textMuted,
            padding: '12px',
            border: '1.5px dashed #d9c8a8',
            borderRadius: '14px',
            background: '#fffdf5',
            textAlign: 'center',
          }}>
            No K2 messages logged yet for this agent.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((m) => {
              const ctxPreview = m.context
                ? (typeof m.context === 'string' ? m.context : JSON.stringify(m.context, null, 2))
                : null
              const isOpen = expanded === m._id
              return (
                <div key={m._id} style={{
                  background: m.channel === 'imessage_group' ? '#f1f7ff' : '#fff',
                  border: `1.5px solid ${m.channel === 'imessage_group' ? '#c9dcef' : '#e6d8bb'}`,
                  borderRadius: '14px',
                  padding: '10px 12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      ...nunito(800, 10),
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: m.channel === 'imessage_group' ? '#31557d' : '#8a6a33',
                    }}>
                      {m.channel === 'imessage_group' ? 'Group chat' : 'DM'}
                    </span>
                    <span style={{ ...nunito(700, 11), color: C.textMuted }}>
                      {formatWhen(m.sentAt)}
                    </span>
                  </div>
                  <p style={{ ...nunito(700, 13), color: C.text, margin: 0, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </p>
                  {ctxPreview && (
                    <>
                      <button
                        onClick={() => setExpanded(isOpen ? null : m._id)}
                        style={{
                          ...nunito(800, 11),
                          color: C.navy,
                          background: 'transparent',
                          border: 'none',
                          padding: '6px 0 0',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px',
                        }}
                      >
                        {isOpen ? 'Hide reasoning context' : 'Show reasoning context'}
                      </button>
                      {isOpen && (
                        <pre style={{
                          ...nunito(600, 11),
                          color: '#3a4a63',
                          background: '#f6f0e1',
                          border: '1px solid #e4d5b3',
                          borderRadius: '10px',
                          padding: '8px 10px',
                          margin: '6px 0 0',
                          maxHeight: '240px',
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}>
                          {ctxPreview}
                        </pre>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

            <p style={{
              ...nunito(600, 11),
              color: C.textMuted,
              fontStyle: 'italic',
              margin: '8px 0 0',
            }}>
              Reasoning traces will populate here once we persist K2 <code>&lt;think&gt;</code> blocks.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
export function AgentsPage() {
  useCozFont()
  const navigate = useNavigate()
  const phone = usePhoneNumber()
  const { user } = useUser()
  const userEmail = (user?.unsafeMetadata?.icloudEmail as string) ?? null

  const bundles = useQuery(
    (api.agents as any).getAgentDirectoryForUser,
    phone || userEmail
      ? { phoneNumber: phone || undefined, email: userEmail || undefined, messageLimit: 10 }
      : 'skip'
  ) as IslandBundle[] | undefined

  const [islandFilter, setIslandFilter] = useState<string>('all')
  const [characterFilter, setCharacterFilter] = useState<string>('all')

  const loading = bundles === undefined
  const islandCount = bundles?.length ?? 0
  const totalCharacters = (bundles ?? []).reduce((sum, b) => sum + b.characters.length, 0)

  const visibleBundles = useMemo(() => {
    const pool = (bundles ?? []).filter((b) => islandFilter === 'all' || b.island._id === islandFilter)
    if (characterFilter === 'all') return pool
    return pool
      .map((b) => ({ ...b, characters: b.characters.filter((c) => c.member._id === characterFilter) }))
      .filter((b) => b.characters.length > 0)
  }, [bundles, islandFilter, characterFilter])

  const characterOptions = useMemo(() => {
    const pool = (bundles ?? []).filter((b) => islandFilter === 'all' || b.island._id === islandFilter)
    return pool.flatMap((b) =>
      b.characters.map((c) => ({
        id: c.member._id,
        label: `${prettyAddress(c.member.phoneNumber)} · ${b.island.name}`,
      }))
    )
  }, [bundles, islandFilter])

  const selectStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '2px solid #d4e5ef',
    borderRadius: '14px',
    padding: '8px 12px',
    color: C.navy,
    ...nunito(800, 13),
    cursor: 'pointer',
    outline: 'none',
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden auto' }}>
      <GameBg />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1060px', margin: '0 auto', padding: '22px 14px 60px' }}>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 100%)`,
            border: '2px solid rgba(255,255,255,0.22)',
            borderRadius: '24px',
            padding: '14px 16px',
            color: '#f2f7ff',
            boxShadow: '0 14px 24px -18px rgba(14,34,55,0.75)',
          }}>
            <div>
              <p style={{ ...nunito(800, 11), color: '#a8bfd6', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Agent Directory
              </p>
              <h1 style={{ ...fredoka(26), margin: '2px 0 0', lineHeight: 1.1, color: '#f6fbff' }}>
                Agents
              </h1>
            </div>
            <p style={{ ...nunito(700, 13), color: '#c5d9ea', margin: '8px 0 0' }}>
              {loading
                ? 'Loading agents…'
                : islandCount === 0
                  ? 'Join or start an island to see its characters here.'
                  : `${totalCharacters} character${totalCharacters === 1 ? '' : 's'} across ${islandCount} island${islandCount === 1 ? '' : 's'}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'stretch' }}>
            <BtnGhost onClick={() => navigate('/dashboard')} style={{ padding: '9px 14px', fontSize: '13px' }}>
              ← Dashboard
            </BtnGhost>
            <BtnGhost onClick={() => navigate('/settings')} style={{ padding: '9px 14px', fontSize: '13px' }}>
              ⚙️ Settings
            </BtnGhost>
          </div>
        </div>

        {/* Island tabs — primary filter */}
        {bundles && bundles.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '14px',
            alignItems: 'center',
          }}>
            <button
              onClick={() => { setIslandFilter('all'); setCharacterFilter('all') }}
              style={{
                ...selectStyle,
                background: islandFilter === 'all' ? C.navy : '#ffffff',
                color:      islandFilter === 'all' ? '#f6fbff' : C.navy,
                borderColor: islandFilter === 'all' ? C.navy : '#d4e5ef',
                border: '2px solid',
              }}
            >
              🗂️ All islands
            </button>
            {bundles.map((b) => {
              const active = islandFilter === b.island._id
              return (
                <button
                  key={b.island._id}
                  onClick={() => { setIslandFilter(b.island._id); setCharacterFilter('all') }}
                  style={{
                    ...selectStyle,
                    background: active ? C.navy : '#ffffff',
                    color: active ? '#f6fbff' : C.navy,
                    borderColor: active ? C.navy : '#d4e5ef',
                    border: '2px solid',
                  }}
                >
                  🏝️ {b.island.name}
                  <span style={{
                    marginLeft: '8px',
                    ...nunito(800, 11),
                    opacity: 0.8,
                  }}>
                    {b.characters.length}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Secondary character filter */}
        {bundles && bundles.length > 0 && characterOptions.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '18px',
            alignItems: 'center',
          }}>
            <span style={{ ...nunito(900, 11), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
              Character
            </span>
            <select
              value={characterFilter}
              onChange={(e) => setCharacterFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All characters</option>
              {characterOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '52px 24px',
            background: 'linear-gradient(180deg, #fffdf7 0%, #f8f2e8 100%)',
            border: `2px dashed ${C.cardBorder}`,
            borderRadius: '24px',
          }}>
            <p style={{ ...fredoka(20), margin: 0, color: C.navy }}>Loading agents…</p>
          </div>
        ) : islandCount === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '52px 24px',
            background: 'linear-gradient(180deg, #fffdf7 0%, #f8f2e8 100%)',
            border: `2px dashed ${C.cardBorder}`,
            borderRadius: '24px',
            boxShadow: '0 12px 20px -18px rgba(31,67,101,0.5)',
          }}>
            <div style={{ fontSize: '52px', marginBottom: '14px' }}>🏝️</div>
            <p style={{ ...fredoka(22), margin: '0 0 6px', color: C.navy }}>No islands yet</p>
            <p style={{ ...nunito(700, 13), color: C.textMuted, margin: 0 }}>
              Join or start an island from the dashboard to see its characters here.
            </p>
          </div>
        ) : visibleBundles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '52px 24px',
            background: 'linear-gradient(180deg, #fffdf7 0%, #f8f2e8 100%)',
            border: `2px dashed ${C.cardBorder}`,
            borderRadius: '24px',
          }}>
            <p style={{ ...fredoka(20), margin: 0, color: C.navy }}>No characters match your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {visibleBundles.map((b) => (
              <section key={b.island._id}>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  marginBottom: '10px',
                  padding: '0 4px',
                }}>
                  <h2 style={{ ...fredoka(22), margin: 0, color: C.navy }}>🏝️ {b.island.name}</h2>
                  <span style={{ ...nunito(800, 11), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    code {b.island.code} · lv {b.island.islandLevel} · {b.characters.length} char{b.characters.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '14px',
                }}>
                  {b.characters.map((c) => (
                    <CharacterCard key={c.member._id} island={b.island} character={c} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
