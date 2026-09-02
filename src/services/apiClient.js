import { getToken, logout } from './authService'

const API_BASE_URL = 'http://localhost:8080/api'

export async function apiFetch(path, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    logout()
    window.location.reload()
    throw new Error('Sesión caducada, vuelve a iniciar sesión')
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || 'Error en la petición')
  }

  if (response.status === 204) {
    return null // No Content, como en tus DELETE
  }

  return response.json()
}