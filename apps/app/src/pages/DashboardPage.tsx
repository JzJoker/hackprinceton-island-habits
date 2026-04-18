import { useState, useEffect } from 'react'
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
  bg:         'linear-gradient(160deg, #0f0a20 0%, #0a1428 30%, #081e14 65%, #050e08 100%)',
  card:       'rgba(16, 8, 2, 0.88)',
  cardBorder: 'rgba(255,200,80,0.12)',
  wood:       'linear-gradient(135deg, #1c0d04 0%, #2e1608 50%, #1a1a06 100%)',
  text:       '#f0ebe0',
  textMuted:  'rgba(220,200,140,0.55)',
  textLabel:  'rgba(210,190,120,0.65)',
  green:      '#4db368',
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
        ? 'rgba(77,179,104,0.35)'
        : 'linear-gradient(135deg, #4db368 0%, #389150 100%)',
      border: 'none',
      borderRadius: '12px',
      color: '#fff',
      padding: '11px 20px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 4px 18px -4px rgba(60,180,90,0.55)',
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
      background: 'rgba(255,255,255,0.06)',
      border: '1.5px solid rgba(255,220,100,0.18)',
      borderRadius: '12px',
      color: C.text,
      padding: '11px 20px',
      cursor: 'pointer',
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
      background: 'radial-gradient(ellipse 80% 50% at 50% 75%, rgba(18,80,45,0.20) 0%, transparent 100%)',
    }} />
    {/* Subtle stars */}
    {[...Array(22)].map((_, i) => (
      <div key={i} style={{
        position: 'fixed',
        width: i % 7 === 0 ? 2.5 : 1.5,
        height: i % 7 === 0 ? 2.5 : 1.5,
        borderRadius: '50%',
        background: i % 5 === 0 ? '#ffd878' : '#e8eeff',
        left: `${(i * 19 + i * i * 2) % 96}%`,
        top: `${2 + (i * 13 + i * 4) % 55}%`,
        opacity: 0.25 + (i % 4) * 0.1,
        zIndex: 0,
        pointerEvents: 'none',
        animation: i % 3 === 0 ? `pulse ${2 + (i % 3) * 0.8}s ease-in-out infinite ${(i * 0.4) % 2}s` : 'none',
      }} />
    ))}
  </>
)

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

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto', padding: '28px 16px 60px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ ...fredoka(30), margin: 0, lineHeight: 1.1 }}>
              {selectedIsland ? selectedIsland.name : 'Your Islands'}
            </h1>
            <p style={{ ...nunito(700, 13), color: C.textMuted, marginTop: '4px' }}>
              {islands.length > 0
                ? `${islands.length} island${islands.length !== 1 ? 's' : ''} in your party`
                : 'No islands yet — join one to start!'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '10px',
            marginBottom: '24px',
          }}>
            {islands.map(island => {
              const selected = island._id === islandId
              return (
                <button
                  key={island._id}
                  onClick={() => navigate(`/island?islandId=${island._id}`)}
                  style={{
                    background: selected ? C.wood : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${selected ? 'rgba(255,180,60,0.55)' : C.cardBorder}`,
                    borderRadius: '18px',
                    padding: '14px 14px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: selected ? '0 6px 24px rgba(0,0,0,0.45)' : 'none',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏝️</div>
                  <p style={{ ...nunito(800, 14), color: C.text, margin: 0 }}>{island.name}</p>
                  <p style={{ ...nunito(600, 11), color: C.textMuted, marginTop: '3px' }}>
                    Lvl {island.islandLevel}
                  </p>
                  {selected && (
                    <div style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      background: 'rgba(77,179,104,0.15)',
                      border: '1px solid rgba(77,179,104,0.3)',
                      borderRadius: '20px',
                      padding: '2px 8px',
                      ...nunito(800, 10),
                      color: '#86efac',
                    }}>
                      Selected
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Island stats ── */}
        {islandId && islandDetails && (
          <>
            <p style={{ ...nunito(800, 11), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '10px' }}>
              Island Stats
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              marginBottom: '28px',
            }}>
              {stats.map(s => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: '18px',
                  padding: '14px 10px',
                  textAlign: 'center',
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
            background: 'rgba(255,255,255,0.03)',
            border: `1px dashed ${C.cardBorder}`,
            borderRadius: '24px',
          }}>
            <div style={{ fontSize: '52px', marginBottom: '14px' }}>🏝️</div>
            <p style={{ ...fredoka(22), margin: '0 0 6px' }}>No islands yet</p>
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
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: 'rgba(12, 6, 2, 0.98)',
            border: '1.5px solid rgba(255,200,80,0.2)',
            borderRadius: '28px',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
          }}>
            {/* Dialog header */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🗺️</div>
              <h2 style={{ ...fredoka(24), margin: 0 }}>Join Island</h2>
              <p style={{ ...nunito(700, 12), color: C.textMuted, marginTop: '4px' }}>
                Enter the code shared by your party leader
              </p>
            </div>

            <form onSubmit={handleJoinIsland}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ ...nunito(800, 11), color: C.textLabel, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
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
                    background: 'rgba(255,255,255,0.06)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    color: C.text,
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