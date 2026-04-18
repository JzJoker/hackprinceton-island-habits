import { SignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'

function useCozFont() {
  useEffect(() => {
    if (document.getElementById('island-fonts')) return
    const link = document.createElement('link')
    link.id = 'island-fonts'
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@600;700;800;900&display=swap'
    document.head.appendChild(link)
  }, [])
}

// Nuclear option: Clerk's elements API doesn't fully override its internal CSS vars / defaults,
// so we inject !important rules targeting the .cl-* class names directly.
// This covers ALL steps (phone, OTP, password, "use another method"...) so nothing overflows.
function useClerkLayoutFix() {
  useEffect(() => {
    if (document.getElementById('clerk-layout-fix')) return
    const style = document.createElement('style')
    style.id = 'clerk-layout-fix'
    style.textContent = `
      /* 1. Universal: box-sizing + min-width 0 on EVERY Clerk element.
            min-width:0 is critical — prevents flex children from forcing content-size width. */
      [class^="cl-"], [class*=" cl-"] {
        box-sizing: border-box !important;
        min-width: 0 !important;
      }

      /* 2. Outer wrappers: transparent + full width, zero padding/margin */
      .cl-rootBox, .cl-cardBox, .cl-card {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
      }

      /* 3. Main content + form: zero padding/margin, full width */
      .cl-main, .cl-form, .cl-formContainer {
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* 4. Form rows/fields: strip any horizontal margin/padding Clerk adds */
      .cl-formFieldRow,
      .cl-formField,
      .cl-formFieldInputGroup,
      .cl-formButtonRow {
        width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      /* 5. Inputs & buttons: force 100% width, no horizontal margins */
      .cl-formFieldInput,
      .cl-phoneInputBox,
      .cl-formButtonPrimary,
      .cl-alternativeMethodsBlockButton {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }

      /* 6. Form layout: flex column with consistent gap */
      .cl-form {
        display: flex !important;
        flex-direction: column !important;
        gap: 14px !important;
      }

      /* 7. Footer (signup link etc): transparent, no extra padding */
      .cl-footer {
        width: 100% !important;
        padding: 0 !important;
        margin-top: 14px !important;
        background: transparent !important;
        box-shadow: none !important;
        border-top: none !important;
      }
      .cl-footerAction {
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    `
    document.head.appendChild(style)
  }, [])
}

const IslandLogo = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="islandBg" cx="45%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#1c3f5e" />
        <stop offset="55%" stopColor="#0d2438" />
        <stop offset="100%" stopColor="#050e1c" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="32" fill="url(#islandBg)" />
    <circle cx="47" cy="14" r="9"   fill="#ffe082" opacity="0.95" />
    <circle cx="49" cy="12" r="5.5" fill="#b87333" opacity="0.14" />
    <circle cx="47" cy="14" r="13"  fill="#ffe082" opacity="0.05" />
    <circle cx="9"  cy="10" r="1.2" fill="white"   opacity="0.9"  />
    <circle cx="19" cy="7"  r="0.9" fill="white"   opacity="0.75" />
    <circle cx="6"  cy="21" r="0.9" fill="white"   opacity="0.8"  />
    <circle cx="14" cy="17" r="0.6" fill="#ffe082" opacity="0.7"  />
    <ellipse cx="32" cy="52" rx="27" ry="7"   fill="#0a2a3d" opacity="0.5"  />
    <ellipse cx="32" cy="46" rx="15" ry="6"   fill="#7a5c10" />
    <ellipse cx="29" cy="44" rx="11" ry="4.5" fill="#c49a22" opacity="0.45" />
    <path d="M32 44 C31 37 33 29 36 22" stroke="#6b3f10" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M36 22 C31 16 21 17 17 20" stroke="#1e7e2e" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M36 22 C40 15 49 14 50 18" stroke="#1e7e2e" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M36 22 C34 14 34 6  36 4"  stroke="#1e7e2e" strokeWidth="2"   strokeLinecap="round" />
    <path d="M36 22 C42 20 46 24 44 28" stroke="#17782a" strokeWidth="2"   strokeLinecap="round" />
    <path d="M36 22 C30 21 26 26 27 30" stroke="#17782a" strokeWidth="2"   strokeLinecap="round" />
    <circle cx="35" cy="24" r="2.2" fill="#3d2007" />
    <circle cx="18" cy="38" r="1.5" fill="#a8ff60" />
    <circle cx="18" cy="38" r="3.5" fill="#a8ff60" opacity="0.2" />
    <circle cx="38" cy="44" r="1.2" fill="#e05a2a" opacity="0.75" />
    <path d="M37 44 L35 43 M37 44 L35 45 M39 44 L41 43 M39 44 L41 45" stroke="#e05a2a" strokeWidth="0.7" opacity="0.75" />
  </svg>
)

const IslandBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
    {/* Night sky */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(180deg, #0a1226 0%, #0f2240 28%, #0b2a32 62%, #061812 100%)',
      }}
    />
    {/* Horizon glow */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 110% 55% at 50% 82%, rgba(40,130,80,0.25) 0%, transparent 70%)',
      }}
    />

    {/* Moon + halo */}
    <div
      className="absolute"
      style={{
        top: '56px',
        right: '9%',
        width: '76px',
        height: '76px',
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 38% 35%, #fff5cc 0%, #ffe082 60%, rgba(255,210,80,0.3) 85%, transparent 100%)',
        boxShadow: '0 0 60px 18px rgba(255,210,80,0.14)',
      }}
    />
    <div
      className="absolute"
      style={{
        top: '36px',
        right: 'calc(9% - 22px)',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        border: '1px solid rgba(255,220,100,0.07)',
      }}
    />

    {/* Stars — fewer, more deliberate */}
    {[...Array(22)].map((_, i) => {
      const warm = i % 6 === 0
      const big = i % 9 === 0
      return (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: big ? 2.5 : i % 3 === 0 ? 2 : 1.5,
            height: big ? 2.5 : i % 3 === 0 ? 2 : 1.5,
            left: `${(i * 19 + i * i * 3 + 4) % 95}%`,
            top: `${3 + ((i * 11) % 45)}%`,
            background: warm ? '#ffd878' : '#e8eeff',
            opacity: 0.35 + (i % 5) * 0.14,
            animation:
              i % 3 === 0
                ? `pulse ${1.8 + (i % 4) * 0.7}s ease-in-out infinite ${(i * 0.4) % 3}s`
                : 'none',
          }}
        />
      )
    })}

    {/* Ground fade */}
    <div
      className="absolute bottom-0 left-0 right-0"
      style={{
        height: '180px',
        background:
          'linear-gradient(to top, #030f08 0%, #071810 55%, transparent 100%)',
      }}
    />

    {/* Island silhouette (2 layers for depth) */}
    <svg
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 right-0"
      style={{ width: '100%', height: '200px', display: 'block' }}
    >
      <path
        d="M0 200 L0 120 Q200 95 400 110 Q600 125 800 95 Q1000 65 1200 105 L1200 200 Z"
        fill="#0a1f12"
      />
      <path
        d="M0 200 L0 150 Q150 135 350 145 Q550 155 750 135 Q950 115 1200 145 L1200 200 Z"
        fill="#04120a"
      />
    </svg>

    {/* Fireflies */}
    {[...Array(7)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full"
        style={{
          width: 5,
          height: 5,
          background: i % 2 === 0 ? '#b4ff70' : '#ffe070',
          left: `${10 + i * 12}%`,
          top: `${62 + (i % 3) * 7}%`,
          opacity: 0.7,
          boxShadow:
            i % 2 === 0
              ? '0 0 10px 3px rgba(150,255,70,0.4)'
              : '0 0 10px 3px rgba(255,220,50,0.35)',
          animation: `ping ${1.4 + i * 0.35}s ease-in-out infinite ${i * 0.55}s`,
        }}
      />
    ))}
  </div>
)

const clerkAppearance = {
  variables: {
    colorPrimary: '#4db368',
    colorBackground: 'transparent',
    colorInputBackground: 'rgba(255,255,255,0.05)',
    colorInputText: '#f0efe8',
    colorText: '#ede8d8',
    colorTextSecondary: 'rgba(230,220,190,0.6)',
    colorNeutral: '#b8c8a0',
    colorDanger: '#f87171',
    borderRadius: '12px',
    fontFamily: "'Nunito', inherit",
    fontSize: '14px',
  },
  elements: {
    rootBox: { width: '100%', minWidth: 0 },
    // 👇 THIS is the one that was breaking out — Clerk's default wrapper has a fixed min-width
    cardBox: {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxShadow: 'none',
      background: 'transparent',
      margin: 0,
    },
    card: {
      background: 'transparent',
      boxShadow: 'none',
      padding: '0',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
    },
    // Normalize Clerk's inner layout so nothing has sneaky default margin/padding
    main:            { padding: 0, margin: 0, width: '100%' },
    form:            { padding: 0, margin: 0, width: '100%', gap: '14px' },
    formFieldRow:    { padding: 0, margin: 0, width: '100%' },
    formField:       { padding: 0, margin: 0, width: '100%' },
    formFieldLabelRow: { padding: 0, margin: '0 0 6px' },
    formButtonRow:   { padding: 0, margin: 0, width: '100%' },
    headerTitle:    { display: 'none' },
    headerSubtitle: { display: 'none' },
    socialButtonsBlockButton: {
      background: 'rgba(255,255,255,0.06)',
      border: '1.5px solid rgba(255,255,255,0.12)',
      color: '#ede8d8',
      borderRadius: '12px',
    },
    dividerRow:  { color: 'rgba(210,200,160,0.3)' },
    dividerLine: { background: 'rgba(210,200,160,0.15)' },
    formFieldLabel: {
      color: 'rgba(220,210,170,0.75)',
      fontSize: '11px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.09em',
      marginBottom: '6px',
    },
    formFieldInput: {
      background: 'rgba(255,255,255,0.05)',
      border: '1.5px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      color: '#f0efe8',
      fontSize: '14px',
      fontWeight: '700',
      padding: '11px 14px',
      boxShadow: 'none',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #4db368 0%, #389150 100%)',
      borderRadius: '12px',
      fontWeight: '900',
      fontSize: '15px',
      padding: '12px',
      boxShadow: '0 4px 20px -4px rgba(60,180,90,0.5)',
      border: 'none',
      textTransform: 'none',
    },
    footer:       { background: 'transparent', padding: '14px 0 0', margin: 0, boxShadow: 'none', borderTop: 'none' },
    footerAction: { background: 'transparent', padding: 0, margin: 0 },
    footerActionLink: { color: '#5fcc7c', fontWeight: '800' },
    identityPreviewText: { color: '#ede8d8' },
    identityPreviewEditButton: { color: '#5fcc7c' },
    otpCodeFieldInput: {
      background: 'rgba(255,255,255,0.05)',
      border: '1.5px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      color: '#f0efe8',
      fontWeight: '900',
      fontSize: '22px',
    },
    phoneInputBox: {
      background: 'rgba(255,255,255,0.05)',
      border: '1.5px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
    },
    formFieldInputShowPasswordButton: { color: 'rgba(210,200,160,0.5)' },
    alert: {
      background: 'rgba(248,113,113,0.09)',
      border: '1px solid rgba(248,113,113,0.28)',
      borderRadius: '12px',
      color: '#fca5a5',
    },
  },
}

const Badge = ({ label, accent }: { label: string; accent: string }) => (
  <span
    style={{
      fontSize: '11px',
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 800,
      background: 'rgba(255,255,255,0.05)',
      border: `1.5px solid ${accent}38`,
      color: accent,
      padding: '4px 10px',
      borderRadius: '999px',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap' as const,
    }}
  >
    {label}
  </span>
)

export function LoginPage() {
  useCozFont()
  useClerkLayoutFix()

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Fredoka One', cursive",
    fontWeight: 400,
    letterSpacing: '0.5px',
    color: '#f5f0e0',
    textShadow: '0 2px 12px rgba(0,0,0,0.5)',
    margin: 0,
  }
  const subtitleStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    color: 'rgba(230,220,180,0.65)',
    fontSize: '13px',
    margin: '6px 0 0',
  }
  const welcomeStyle: React.CSSProperties = {
    fontFamily: "'Fredoka One', cursive",
    fontWeight: 400,
    color: '#f5f0e0',
    letterSpacing: '0.3px',
    margin: 0,
  }
  const hintStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    color: 'rgba(210,200,160,0.55)',
    fontSize: '12px',
    margin: '4px 0 0',
  }

  const badges = [
    { label: '🏝️ Island',  accent: '#5fcc7c' },
    { label: '👥 Party',   accent: '#ffd878' },
    { label: '🏗️ Build',   accent: '#e07a5f' },
    { label: '🔥 Streaks', accent: '#ff9f4a' },
  ]

  return (
    <main
      className="relative min-h-screen w-full flex items-center justify-center px-4 py-8"
      style={{ overflow: 'hidden' }}
    >
      <IslandBg />

      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>

      <SignedOut>
        <div className="relative z-10 w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-500">
          <div
            style={{
              borderRadius: '28px',
              overflow: 'hidden',
              background:
                'linear-gradient(165deg, rgba(18,28,40,0.92) 0%, rgba(10,20,28,0.94) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(255,220,100,0.1)',
              boxShadow:
                '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '32px 28px 0', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '10px',
                  borderRadius: '22px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1.5px solid rgba(255,220,100,0.14)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                  marginBottom: '14px',
                }}
              >
                <IslandLogo />
              </div>
              <h1 style={{ ...titleStyle, fontSize: '28px' }}>Island Habits</h1>
              <p style={subtitleStyle}>Build habits. Grow your island. 🌱</p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '18px 0 4px',
                }}
              >
                {badges.map((b) => (
                  <Badge key={b.label} {...b} />
                ))}
              </div>
            </div>

            {/* Hairline divider */}
            <div
              style={{
                height: '1px',
                margin: '22px 24px 0',
                background:
                  'linear-gradient(to right, transparent, rgba(255,220,100,0.18), transparent)',
              }}
            />

            {/* Form */}
            <div style={{ padding: '22px 24px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <h2 style={{ ...welcomeStyle, fontSize: '20px' }}>
                  Welcome back 👋
                </h2>
                <p style={hintStyle}>Sign in with your phone number</p>
              </div>
              <SignIn
                routing="virtual"
                forceRedirectUrl="/dashboard"
                signUpUrl="/signup"
                fallbackRedirectUrl="/dashboard"
                appearance={clerkAppearance}
              />
            </div>
          </div>

          <p
            style={{
              textAlign: 'center',
              fontSize: '10px',
              color: 'rgba(200,185,140,0.28)',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              marginTop: '16px',
              letterSpacing: '0.04em',
            }}
          >
            Island Habits · Built at HackPrinceton 🏆
          </p>
        </div>
      </SignedOut>
    </main>
  )
}