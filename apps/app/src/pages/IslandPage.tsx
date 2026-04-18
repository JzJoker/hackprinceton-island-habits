import { useSearchParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { usePhoneNumber } from '../hooks/usePhoneNumber'

export function IslandPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const phone = usePhoneNumber()
  
  const islandId = searchParams.get('islandId')
  const playerId = searchParams.get('playerId') || phone || user?.id

  return (
    <main className="h-screen w-screen bg-black text-white relative overflow-hidden">
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-4 left-4 z-50 rounded-lg border border-white/20 bg-black/50 px-4 py-2 font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
      >
        Back to Dashboard
      </button>

      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-neutral-900">
        <h1 className="text-3xl font-bold mb-4">Island Fullscreen View</h1>
        <p className="text-neutral-400 font-mono text-sm mb-2">
          Island ID: {islandId || 'Not provided'}
        </p>
        <p className="text-neutral-400 font-mono text-sm">
          Player ID: {playerId || 'Not provided'}
        </p>
        
        <div className="mt-8 border border-dashed border-neutral-600 p-8 rounded-xl max-w-lg">
          <p className="text-neutral-500">
            {/* TODO: Insert Island Screen code here */}
            Empty screen ready for island implementation.
          </p>
        </div>
      </div>
    </main>
  )
}
