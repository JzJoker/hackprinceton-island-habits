import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useConvex, useMutation } from 'convex/react'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

type Step = 'code' | 'phoneSelect' | 'goals' | 'complete'

export function OnboardingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const convex = useConvex()
  const joinIsland = useMutation(api.islands.joinIsland)
  const addGoals = useMutation(api.goals.addGoals)
  const createAgent = useMutation(api.agents.createAgent)
  const activateIsland = useMutation(api.islands.activateIsland)

  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [selectedPhone, setSelectedPhone] = useState('')
  const [goals, setGoals] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [islandPhones, setIslandPhones] = useState<string[]>([])
  const [currentIslandId, setCurrentIslandId] = useState<Id<'islands'> | null>(
    null,
  )

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode) {
      setError('Please enter a game code.')
      return
    }

    if (!/^[A-Z0-9]{4,6}$/.test(normalizedCode)) {
      setError('Code must be 4-6 letters or numbers.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const island = await convex.query(api.islands.getIslandByCode, {
        code: normalizedCode,
      })
      if (!island) {
        throw new Error('Code not found. Ask your group to run /start and share the new code.')
      }
      if (island.status !== 'onboarding') {
        throw new Error('Island is not in onboarding mode')
      }
      setIslandPhones(island.phoneNumbers || [])
      setCurrentIslandId(island._id)
      setStep('phoneSelect')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Island not found')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneSelect = () => {
    if (!selectedPhone) {
      setError('Please select a phone number')
      return
    }
    setError(null)
    setStep('goals')
  }

  const addGoalField = () => {
    if (goals.length < 5) {
      setGoals([...goals, ''])
    }
  }

  const updateGoal = (index: number, value: string) => {
    const updated = [...goals]
    updated[index] = value
    setGoals(updated)
  }

  const removeGoalField = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index))
  }

  const handleGoalsSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const filledGoals = goals.map((g) => g.trim()).filter(Boolean)

    if (filledGoals.length === 0) {
      setError('Please add at least one goal')
      return
    }

    if (filledGoals.length > 5) {
      setError('Maximum 5 goals allowed')
      return
    }

    if (!currentIslandId) {
      setError('Island ID not found')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await joinIsland({ islandId: currentIslandId, phoneNumber: selectedPhone })
      await addGoals({
        islandId: currentIslandId,
        phoneNumber: selectedPhone,
        goals: filledGoals,
      })
      await createAgent({
        islandId: currentIslandId,
        phoneNumber: selectedPhone,
        goals: filledGoals,
      })
      await activateIsland({ islandId: currentIslandId })
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goals')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:py-20">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Island Habits
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">
            {step === 'code' && 'Enter your game code to join'}
            {step === 'phoneSelect' && 'Select your phone number'}
            {step === 'goals' && 'What are your goals for this week?'}
            {step === 'complete' && 'Onboarding complete!'}
          </p>
        </div>

        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-200">
                Game Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., A1B2 or ABC123"
                maxLength={6}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">4-6 alphanumeric characters.</p>
            </div>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Joining...' : 'Join Island'}
            </button>
          </form>
        )}

        {step === 'phoneSelect' && (
          <div className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-200">
                Which phone number is yours?
              </legend>
              {islandPhones.map((phone) => (
                <label key={phone} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="phone"
                    value={phone}
                    checked={selectedPhone === phone}
                    onChange={(e) => setSelectedPhone(e.target.value)}
                    className="h-4 w-4 border-slate-600 text-cyan-400"
                  />
                  <span className="text-slate-300">{phone}</span>
                </label>
              ))}
            </fieldset>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button
              onClick={handlePhoneSelect}
              className="w-full rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'goals' && (
          <form onSubmit={handleGoalsSubmit} className="space-y-4">
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => updateGoal(index, e.target.value)}
                    placeholder={`Goal ${index + 1}...`}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  {goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGoalField(index)}
                      className="rounded-lg bg-slate-800 px-3 py-2 text-slate-300 hover:bg-slate-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addGoalField}
              disabled={goals.length >= 5}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add Goal
            </button>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Complete Onboarding'}
            </button>
          </form>
        )}

        {step === 'complete' && (
          <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-cyan-200">Welcome!</h2>
              <p className="text-slate-300">
                Your character has been created and is ready to explore the island.
              </p>
            </div>
            <button
              onClick={() =>
                navigate(
                  `/dashboard?islandId=${currentIslandId ?? ''}&phone=${encodeURIComponent(selectedPhone)}`,
                )
              }
              className="w-full rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Go to Island
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
