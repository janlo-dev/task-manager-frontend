import { apiFetch } from './apiClient'

export function getColumnsByBoard(boardId) {
  return apiFetch(`/columns/board/${boardId}`)
}