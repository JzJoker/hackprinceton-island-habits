import { useState } from 'react'

const TOKEN_KEY = 'island_token'
const USER_ID_KEY = 'island_user_id'
const PHONE_KEY = 'island_phone'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

export function getPhone(): string | null {
  return localStorage.getItem(PHONE_KEY)
}

function setSession(token: string, userId: string, phone: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_ID_KEY, userId)
  localStorage.setItem(PHONE_KEY, phone)
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(PHONE_KEY)
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(getToken)
  const [userId, setUserId] = useState<string | null>(getUserId)
  const [phone, setPhone] = useState<string | null>(getPhone)

  function login(newToken: string, newUserId: string, newPhone: string) {
    setSession(newToken, newUserId, newPhone)
    setToken(newToken)
    setUserId(newUserId)
    setPhone(newPhone)
  }

  function logout() {
    clearSession()
    setToken(null)
    setUserId(null)
    setPhone(null)
  }

  return { token, userId, phone, login, logout, isAuthenticated: token !== null }
}
