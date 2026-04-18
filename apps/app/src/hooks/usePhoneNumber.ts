import { useUser } from '@clerk/clerk-react'

export function usePhoneNumber(): string {
  const { user } = useUser()
  return (
    user?.primaryPhoneNumber?.phoneNumber ??
    user?.phoneNumbers?.[0]?.phoneNumber ??
    ''
  )
}
