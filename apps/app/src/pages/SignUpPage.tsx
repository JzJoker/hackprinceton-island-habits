import { SignUp, SignedIn, SignedOut } from '@clerk/clerk-react'
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

function useClerkLayoutFix() {
  useEffect(() => {
    if (document.getElementById('clerk-layout-fix')) return
    const style = document.createElement('style')
    style.id = 'clerk-layout-fix'
    style.textContent = `
      [class^="cl-"], [class*=" cl-"] {
        box-sizing: border-box !important;
        min-width: 0 !important;
      }
      .cl-rootBox, .cl-cardBox, .cl-card {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
      }
      .cl-main, .cl-form, .cl-formContainer {
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }
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
      .cl-formFieldInput,
      .cl-phoneInputBox,
      .cl-formButtonPrimary,
      .cl-alternativeMethodsBlockButton {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      .cl-form {
        display: flex !important;
        flex-direction: column !important;
        gap: 14px !important;
      }
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
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(180deg, #ecd8bf 0%, #b9e6ea 16%, #9ad3dd 62%, #89c8d6 100%)',
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 82% 46% at 50% 83%, rgba(130,207,220,0.65) 0%, rgba(130,207,220,0.0) 100%)',
      }}
    />

    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          width: 180 + (i % 3) * 110,
          height: 180 + (i % 3) * 110,
          borderRadius: '50%',
          background: i % 2 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(199,236,243,0.34)',
          left: `${(i * 17 + i * i * 5) % 94}%`,
          top: `${2 + (i * 11 + i * 9) % 72}%`,
          opacity: 0.55,
          filter: 'blur(44px)',
          transform: 'translate(-50%, -50%)',
        }}
      />
    ))}
  </div>
)

const clerkAppearance = {
  variables: {
    colorPrimary: '#57d196',
    colorBackground: 'transparent',
    colorInputBackground: '#ffffff',
    colorInputText: '#1d3451',
    colorText: '#223856',
    colorTextSecondary: '#6d7b8f',
    colorNeutral: '#7f95ab',
    colorDanger: '#f87171',
    borderRadius: '14px',
    fontFamily: "'Nunito', inherit",
    fontSize: '14px',
  },
  elements: {
    rootBox: { width: '100%', minWidth: 0 },
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
    main:              { padding: 0, margin: 0, width: '100%' },
    form:              { padding: 0, margin: 0, width: '100%', gap: '14px' },
    formFieldRow:      { padding: 0, margin: 0, width: '100%' },
    formField:         { padding: 0, margin: 0, width: '100%' },
    formFieldLabelRow: { padding: 0, margin: '0 0 6px' },
    formButtonRow:     { padding: 0, margin: 0, width: '100%' },
    headerTitle:    { display: 'none' },
    headerSubtitle: { display: 'none' },
    socialButtonsBlockButton: {
      background: '#ffffff',
      border: '2px solid #d4e5ef',
      color: '#1d3451',
      borderRadius: '14px',
    },
    dividerRow:  { color: '#9db1c7' },
    dividerLine: { background: '#d6e4f1' },
    formFieldLabel: {
      color: '#6c86a4',
      fontSize: '11px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.09em',
      marginBottom: '6px',
    },
    formFieldInput: {
      background: '#ffffff',
      border: '2px solid #d6e5f2',
      borderRadius: '14px',
      color: '#1d3451',
      fontSize: '14px',
      fontWeight: '700',
      padding: '11px 14px',
      boxShadow: 'none',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #57d196 0%, #3db97f 100%)',
      borderRadius: '14px',
      fontWeight: '900',
      fontSize: '15px',
      padding: '12px',
      boxShadow: '0 8px 18px -8px rgba(36,122,78,0.48)',
      border: '2px solid rgba(27,64,45,0.16)',
      textTransform: 'none',
    },
    footer:       { background: 'transparent', padding: '14px 0 0', margin: 0, boxShadow: 'none', borderTop: 'none' },
    footerAction: { background: 'transparent', padding: 0, margin: 0 },
    footerActionLink: { color: '#31557d', fontWeight: '800' },
    identityPreviewText: { color: '#223856' },
    identityPreviewEditButton: { color: '#31557d' },
    otpCodeFieldInput: {
      background: '#ffffff',
      border: '2px solid #d6e5f2',
      borderRadius: '14px',
      color: '#1d3451',
      fontWeight: '900',
      fontSize: '22px',
    },
    phoneInputBox: {
      background: '#ffffff',
      border: '2px solid #d6e5f2',
      borderRadius: '14px',
    },
    formFieldInputShowPasswordButton: { color: '#7a91a9' },
    alert: {
      background: 'rgba(248,113,113,0.1)',
      border: '1px solid rgba(248,113,113,0.25)',
      borderRadius: '12px',
      color: '#b83732',
    },
  },
}

const Badge = ({ label, accent }: { label: string; accent: string }) => (
  <span
    style={{
      fontSize: '11px',
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 800,
      background: '#ffffff',
      border: `1.5px solid ${accent}55`,
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

export function SignUpPage() {
  useCozFont()
  useClerkLayoutFix()

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Fredoka One', cursive",
    fontWeight: 400,
    letterSpacing: '0.5px',
    color: '#1d3451',
    margin: 0,
  }
  const subtitleStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    color: '#6d7b8f',
    fontSize: '13px',
    margin: '6px 0 0',
  }
  const welcomeStyle: React.CSSProperties = {
    fontFamily: "'Fredoka One', cursive",
    fontWeight: 400,
    color: '#1d3451',
    letterSpacing: '0.3px',
    margin: 0,
  }
  const hintStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    color: '#6d7b8f',
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
                'linear-gradient(180deg, #fffef8 0%, #f7f2e6 100%)',
              border: '2px solid #d7bc8f',
              boxShadow: '0 30px 64px -36px rgba(22,49,76,0.78)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '32px 28px 0', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '10px',
                  borderRadius: '22px',
                  background: '#ffffff',
                  border: '1.5px solid #d6e5f2',
                  boxShadow: '0 10px 16px -14px rgba(29,52,81,0.6)',
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
                  'linear-gradient(to right, transparent, rgba(122,159,191,0.35), transparent)',
              }}
            />

            {/* Form */}
            <div style={{ padding: '22px 24px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <h2 style={{ ...welcomeStyle, fontSize: '20px' }}>
                  Welcome to the island 🏝️
                </h2>
                <p style={hintStyle}>Create an account with your phone</p>
              </div>
              <SignUp
                routing="virtual"
                forceRedirectUrl="/dashboard"
                signInUrl="/login"
                fallbackRedirectUrl="/dashboard"
                appearance={clerkAppearance}
              />
            </div>
          </div>

          <p
            style={{
              textAlign: 'center',
              fontSize: '10px',
              color: 'rgba(43,73,102,0.46)',
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
