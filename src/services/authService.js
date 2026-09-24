import { API_BASE_URL } from './config'

const TOKEN_KEY = 'accessToken'
const USER_ID_KEY = 'userId'

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error('Credenciales incorrectas')
  }

  const data = await response.json()
  saveAuth(data.accessToken, data.userId)
  return data
}

export async function register(name, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || 'Error al registrar')
  }

  const data = await response.json()
  saveAuth(data.accessToken, data.userId)
  return data
}

export function saveAuth(accessToken, userId) {
  sessionStorage.setItem(TOKEN_KEY, accessToken)
  sessionStorage.setItem(USER_ID_KEY, userId)
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getUserId() {
  return sessionStorage.getItem(USER_ID_KEY)
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_ID_KEY)
}

export function isAuthenticated() {
  return getToken() !== null
}