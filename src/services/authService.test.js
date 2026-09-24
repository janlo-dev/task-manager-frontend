import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { login, register, logout, getToken, getUserId, isAuthenticated } from './authService'

// Respuesta mínima con la forma que usa authService (ok + json())
const jsonResponse = (ok, body) => ({
  ok,
  json: () => (body === undefined ? Promise.reject(new Error('sin cuerpo')) : Promise.resolve(body)),
})

describe('authService', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('login', () => {
    it('con éxito envía las credenciales y guarda token y userId en sessionStorage', async () => {
      fetch.mockResolvedValue(jsonResponse(true, { accessToken: 'jwt-123', userId: 7 }))

      const data = await login('ana@test.com', 'secreto')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'ana@test.com', password: 'secreto' }),
        })
      )
      expect(data).toEqual({ accessToken: 'jwt-123', userId: 7 })
      expect(getToken()).toBe('jwt-123')
      expect(getUserId()).toBe('7')
    })

    it('con credenciales incorrectas lanza el error y no guarda nada', async () => {
      fetch.mockResolvedValue(jsonResponse(false, { error: 'Unauthorized' }))

      await expect(login('ana@test.com', 'mala')).rejects.toThrow('Credenciales incorrectas')

      expect(getToken()).toBeNull()
      expect(getUserId()).toBeNull()
    })
  })

  describe('register', () => {
    it('con éxito envía los datos y guarda token y userId en sessionStorage', async () => {
      fetch.mockResolvedValue(jsonResponse(true, { accessToken: 'jwt-456', userId: 8 }))

      await register('Ana', 'ana@test.com', 'secreto')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Ana', email: 'ana@test.com', password: 'secreto' }),
        })
      )
      expect(getToken()).toBe('jwt-456')
      expect(getUserId()).toBe('8')
    })

    it('si falla lanza el mensaje de error del backend y no guarda nada', async () => {
      fetch.mockResolvedValue(jsonResponse(false, { error: 'El email ya está registrado' }))

      await expect(register('Ana', 'ana@test.com', 'secreto')).rejects.toThrow('El email ya está registrado')

      expect(getToken()).toBeNull()
      expect(getUserId()).toBeNull()
    })

    it('si falla sin cuerpo de error usa el mensaje genérico', async () => {
      fetch.mockResolvedValue(jsonResponse(false, undefined))

      await expect(register('Ana', 'ana@test.com', 'secreto')).rejects.toThrow('Error al registrar')

      expect(getToken()).toBeNull()
    })
  })

  describe('logout', () => {
    it('limpia token y userId de sessionStorage', () => {
      sessionStorage.setItem('accessToken', 'jwt-123')
      sessionStorage.setItem('userId', '7')
      expect(isAuthenticated()).toBe(true)

      logout()

      expect(getToken()).toBeNull()
      expect(getUserId()).toBeNull()
      expect(isAuthenticated()).toBe(false)
    })
  })
})
