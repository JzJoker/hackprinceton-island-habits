import { useState, useEffect, useMemo } from 'react'
import { useConvex, useMutation, useQuery } from 'convex/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import { usePhoneNumber } from '../hooks/usePhoneNumber'

/* ── Cozy font loader ─────────────────────────────────── */
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

/* ── Design tokens ────────────────────────────────────── */
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

/* ── Shared button primitives ─────────────────────────── */
const BtnPrimary = ({
  children, onClick, disabled, type = 'button', style,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled
        ? 'linear-gradient(135deg, #9fdbbc 0%, #8dc9a9 100%)'
        : 'linear-gradient(135deg, #57d196 0%, #3db97f 100%)',
      border: '2px solid rgba(27,64,45,0.16)',
      borderRadius: '16px',
      color: '#fff',
      padding: '10px 18px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 8px 18px -8px rgba(36,122,78,0.48)',
      transition: 'all 0.15s',
      ...nunito(900, 14),
      ...style,
    }}
  >
    {children}
  </button>
)

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

/* ── Ambient background glow ──────────────────────────── */
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

const seededFrom = (text: string) => {
  let seed = 2166136261
  for (let i = 0; i < text.length; i++) {
    seed ^= text.charCodeAt(i)
    seed = Math.imul(seed, 16777619)
  }
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

const MiniIslandPreview = ({
  code,
  playerCount,
  level,
  selected,
}: {
  code: string
  playerCount: number
  level: number
  selected: boolean
}) => {
  const scene = useMemo<{
    shrubs: Array<{ x: number; y: number; s: number; o: number }>
    players: Array<{ x: number; y: number; c: string }>
    houses: Array<{ x: number; y: number; r: number }>
  }>(() => {
    const rand = seededFrom(code)
    const shrubs = Array.from({ length: 7 }).map(() => ({
      x: 16 + rand() * 68,
      y: 50 + rand() * 28,
      s: 10 + rand() * 16,
      o: 0.2 + rand() * 0.25,
    }))
    const players = Array.from({ length: Math.min(5, Math.max(1, playerCount)) }).map(() => ({
      x: 20 + rand() * 60,
      y: 50 + rand() * 24,
      c: `hsl(${20 + rand() * 280} 64% 73%)`,
    }))
    const houses = Array.from({ length: Math.min(4, Math.max(1, Math.ceil(level / 3))) }).map(() => ({
      x: 20 + rand() * 58,
      y: 42 + rand() * 22,
      r: -8 + rand() * 16,
    }))
    return { shrubs, players, houses }
  }, [code, level, playerCount])

  return (
    <div style={{
      position: 'relative',
      height: '112px',
      borderRadius: '18px',
      overflow: 'hidden',
      border: `1.5px solid ${selected ? '#7ca4d1' : '#d3e3f0'}`,
      background: 'linear-gradient(180deg, #ead7bc 0%, #bde6e8 24%, #9ed3dc 100%)',
      boxShadow: 'inset 0 -24px 36px -28px rgba(41,88,116,0.35)',
    }}>
      <div style={{
        position: 'absolute',
        inset: '56px 12px 8px',
        borderRadius: '999px',
        background: 'linear-gradient(180deg, #7bb45c 0%, #6aa653 100%)',
        border: '2px solid rgba(74,120,59,0.34)',
      }} />
      {scene.shrubs.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: `${s.s}px`,
          height: `${s.s * 0.5}px`,
          borderRadius: '999px',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(92,160,74,0.9)',
          opacity: s.o,
        }} />
      ))}
      {scene.houses.map((h, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${h.x}%`,
          top: `${h.y}%`,
          width: '14px',
          height: '10px',
          borderRadius: '3px',
          transform: `translate(-50%, -50%) rotate(${h.r}deg)`,
          background: '#f8ecd9',
          border: '1px solid rgba(76,84,103,0.22)',
          boxShadow: '0 2px 0 rgba(41,54,68,0.2)',
        }} />
      ))}
      {scene.players.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background: p.c,
          border: '1.5px solid #ffffff',
        }} />
      ))}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '10px',
        background: 'rgba(26,56,85,0.85)',
        color: '#edf7ff',
        borderRadius: '999px',
        padding: '2px 8px',
        ...nunito(900, 9),
        letterSpacing: '0.06em',
      }}>
        PREVIEW
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
export function DashboardPage() {
  useCozFont()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const islandIdParam = searchParams.get('islandId')
  const phone = usePhoneNumber()
  const islandId = islandIdParam as Id<'islands'> | null

  const [joinCode, setJoinCode]       = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError]     = useState<string | null>(null)
  const [showJoinDialog, setShowJoinDialog] = useState(false)

  const { user } = useUser()
  const convex = useConvex()
  const userEmail = (user?.unsafeMetadata?.icloudEmail as string) ?? null

  const islandsByPhone = useQuery(api.islands.getIslandsByPhone, phone     ? { phoneNumber: phone }     : 'skip')
  const islandsByEmail = useQuery(api.islands.getIslandsByPhone, userEmail ? { phoneNumber: userEmail } : 'skip')

  const islands = Array.from(
    new Map(
      [...(islandsByPhone ?? []), ...(islandsByEmail ?? [])]
        .map(island => [island._id, island])
    ).values()
  )

  const islandDetails = useQuery(api.islands.getIslandDetails, islandId ? { islandId } : 'skip')
  const joinIslandMut = useMutation(api.islands.joinIsland)

  const motivation =
    islandDetails?.agents?.length
      ? Math.round(islandDetails.agents.reduce((s, a) => s + a.motivation, 0) / islandDetails.agents.length)
      : 0

  const handleJoinIsland = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code)                        { setJoinError('Please enter a game code.');        return }
    if (!/^[A-Z0-9]{4,6}$/.test(code)) { setJoinError('Code must be 4–6 letters or numbers.'); return }
    if (!phone)                       { setJoinError('Phone number not found.');          return }

    setJoinLoading(true)
    setJoinError(null)
    try {
      const island = await convex.query(api.islands.getIslandByCode, { code })
      if (!island) throw new Error('Island code not found.')
      await joinIslandMut({ islandId: island._id, phoneNumber: phone })
      setJoinCode('')
      setShowJoinDialog(false)
      navigate(`/island?islandId=${island._id}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join island')
    } finally {
      setJoinLoading(false)
    }
  }

  const selectedIsland = islands.find(i => i._id === islandId)

  const stats = islandDetails
    ? [
        { icon: '🏝️', label: 'Level',      value: String(islandDetails.island.islandLevel ?? 0) },
        { icon: '⭐', label: 'XP',          value: String(islandDetails.island.xp ?? 0) },
        { icon: '🌟', label: 'Currency',    value: String(islandDetails.island.currency ?? 0) },
        { icon: '🔥', label: 'Motivation',  value: `${motivation}%` },
      ]
    : []

  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden auto' }}>
      <GameBg />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1060px', margin: '0 auto', padding: '22px 14px 60px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 100%)`,
            border: '2px solid rgba(255,255,255,0.22)',
            borderRadius: '24px',
            padding: '14px 16px',
            color: '#f2f7ff',
            boxShadow: '0 14px 24px -18px rgba(14,34,55,0.75)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <p style={{ ...nunito(800, 11), color: '#a8bfd6', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Islands</p>
                <h1 style={{ ...fredoka(26), margin: '2px 0 0', lineHeight: 1.1, color: '#f6fbff' }}>
                  {selectedIsland ? selectedIsland.name : 'Island Party'}
                </h1>
              </div>
            </div>
            <p style={{ ...nunito(700, 13), color: '#c5d9ea', margin: '8px 0 0' }}>
              {islands.length > 0
                ? `${islands.length} island${islands.length !== 1 ? 's' : ''} in your party`
                : 'No islands yet — join one to start!'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'stretch' }}>
            <BtnGhost onClick={() => navigate('/settings')} style={{ padding: '9px 14px', fontSize: '13px' }}>
              ⚙️ Settings
            </BtnGhost>
            <BtnPrimary onClick={() => setShowJoinDialog(true)} style={{ padding: '9px 14px', fontSize: '13px' }}>
              + Join
            </BtnPrimary>
          </div>
        </div>

        {/* ── Island cards grid ── */}
        {islands.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}>
            {islands.map(island => {
              const selected = island._id === islandId
              const playerCount = Math.max(1, island.phoneNumbers?.length ?? 1)
              return (
                <button
                  key={island._id}
                  onClick={() => navigate(`/island?islandId=${island._id}`)}
                  style={{
                    background: selected
                      ? 'linear-gradient(160deg, #fef5e8 0%, #f8efe0 100%)'
                      : 'linear-gradient(160deg, #fffdf8 0%, #f8f4ea 100%)',
                    border: `2px solid ${selected ? '#8fb2d9' : C.cardBorder}`,
                    borderRadius: '22px',
                    padding: '10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: selected
                      ? '0 16px 24px -18px rgba(31,67,101,0.65)'
                      : '0 10px 18px -16px rgba(31,67,101,0.4)',
                  }}
                >
                  <MiniIslandPreview
                    code={island.code}
                    playerCount={playerCount}
                    level={island.islandLevel ?? 0}
                    selected={selected}
                  />
                  <div style={{ marginTop: '10px', padding: '0 2px 2px' }}>
                    <p style={{ ...nunito(900, 14), color: C.navy, margin: 0 }}>{island.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        borderRadius: '999px',
                        padding: '3px 8px',
                        background: '#eaf2fa',
                        color: '#31557d',
                        ...nunito(800, 11),
                      }}>
                        Lv {island.islandLevel}
                      </span>
                      <span style={{
                        borderRadius: '999px',
                        padding: '3px 8px',
                        background: '#edf8f2',
                        color: '#3a7f56',
                        ...nunito(800, 11),
                      }}>
                        {playerCount} players
                      </span>
                      {selected && (
                        <span style={{
                          borderRadius: '999px',
                          padding: '3px 8px',
                          background: '#203955',
                          color: '#f1f7ff',
                          ...nunito(900, 10),
                          letterSpacing: '0.06em',
                        }}>
                          SELECTED
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Island stats ── */}
        {islandId && islandDetails && (
          <>
            <p style={{ ...nunito(900, 11), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 10px 4px' }}>
              Island Stats
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              marginBottom: '24px',
            }}>
              {stats.map(s => (
                <div key={s.label} style={{
                  background: C.cream,
                  border: `2px solid ${C.cardBorder}`,
                  borderRadius: '18px',
                  padding: '14px 10px',
                  textAlign: 'center',
                  boxShadow: '0 10px 18px -18px rgba(31,67,101,0.48)',
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
                  <p style={{ ...nunito(700, 10), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                    {s.label}
                  </p>
                  <p style={{ ...fredoka(22), margin: '4px 0 0', lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {islands.length === 0 && (
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
            <p style={{ ...nunito(700, 13), color: C.textMuted, margin: '0 0 22px' }}>
              Join a party to start building habits together
            </p>
            <BtnPrimary onClick={() => setShowJoinDialog(true)} style={{ padding: '12px 32px', fontSize: '15px' }}>
              + Join Island
            </BtnPrimary>
          </div>
        )}
      </div>

      {/* ══ Join dialog ══ */}
      {showJoinDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(26,40,57,0.42)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #fffef8 0%, #f7f2e6 100%)',
            border: '2px solid #d7bc8f',
            borderRadius: '28px',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 30px 64px -36px rgba(22,49,76,0.78)',
          }}>
            {/* Dialog header */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🗺️</div>
              <h2 style={{ ...fredoka(24), margin: 0, color: C.navy }}>Join Island</h2>
              <p style={{ ...nunito(700, 12), color: C.textMuted, marginTop: '4px' }}>
                Enter the code shared by your party leader
              </p>
            </div>

            <form onSubmit={handleJoinIsland}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ ...nunito(900, 11), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                  Game Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="A1B2C3"
                  maxLength={6}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    border: '2px solid #d6e5f2',
                    borderRadius: '14px',
                    color: C.navy,
                    padding: '12px 14px',
                    fontSize: '20px',
                    fontFamily: "'Fredoka One', cursive",
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <p style={{ ...nunito(600, 11), color: C.textMuted, textAlign: 'center', marginTop: '6px' }}>
                  4–6 characters
                </p>
              </div>

              {joinError && (
                <div style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                }}>
                  <p style={{ ...nunito(700, 12), color: '#fca5a5', margin: 0 }}>⚠️ {joinError}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <BtnPrimary type="submit" disabled={joinLoading} style={{ flex: 1, padding: '12px 8px', textAlign: 'center' }}>
                  {joinLoading ? 'Joining...' : 'Join 🏝️'}
                </BtnPrimary>
                <BtnGhost
                  onClick={() => { setShowJoinDialog(false); setJoinCode(''); setJoinError(null) }}
                  style={{ flex: 1, padding: '12px 8px', textAlign: 'center' }}
                >
                  Cancel
                </BtnGhost>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
