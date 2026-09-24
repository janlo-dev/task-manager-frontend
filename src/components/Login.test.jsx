import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './Login'
import { login } from '../services/authService'

vi.mock('../services/authService', () => ({
  login: vi.fn(),
}))

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function fillAndSubmit(email, password) {
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), email)
    await user.type(screen.getByLabelText('Contraseña'), password)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
  }

  it('llama a login con el email y la contraseña escritos y avisa del éxito', async () => {
    login.mockResolvedValue({ accessToken: 'jwt-123', userId: 7 })
    const onLoginSuccess = vi.fn()
    render(<Login onLoginSuccess={onLoginSuccess} />)

    await fillAndSubmit('ana@test.com', 'secreto')

    expect(login).toHaveBeenCalledWith('ana@test.com', 'secreto')
    expect(onLoginSuccess).toHaveBeenCalledTimes(1)
  })

  it('muestra el mensaje de error si login falla y no avisa del éxito', async () => {
    login.mockRejectedValue(new Error('Credenciales incorrectas'))
    const onLoginSuccess = vi.fn()
    render(<Login onLoginSuccess={onLoginSuccess} />)

    await fillAndSubmit('ana@test.com', 'mala')

    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument()
    expect(onLoginSuccess).not.toHaveBeenCalled()
  })
})
