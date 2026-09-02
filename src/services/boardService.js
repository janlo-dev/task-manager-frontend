import { apiFetch } from './apiClient'

export function getMyBoards() {
  return apiFetch('/boards/me')
}

export function createBoard(name, boardOrder) {
  return apiFetch('/boards', {
    method: 'POST',
    body: JSON.stringify({ name, boardOrder }),
  })
}