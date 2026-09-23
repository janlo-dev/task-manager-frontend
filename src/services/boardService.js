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

export function renameBoard(boardId, newName) {
  return apiFetch('/boards/rename', {
    method: 'PUT',
    body: JSON.stringify({ boardId, newName }),
  })
}

export function deleteBoard(boardId) {
  return apiFetch(`/boards/${boardId}`, { method: 'DELETE' })
}
