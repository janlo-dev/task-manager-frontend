import { apiFetch } from './apiClient'

export function getBoardMembers(boardId) {
  return apiFetch(`/boards/${boardId}/members`)
}

export function inviteBoardMember(boardId, email) {
  return apiFetch('/boards/members/invite', {
    method: 'POST',
    body: JSON.stringify({ boardId, email }),
  })
}

export function removeBoardMember(boardId, memberUserId) {
  return apiFetch(`/boards/${boardId}/members/${memberUserId}`, { method: 'DELETE' })
}
