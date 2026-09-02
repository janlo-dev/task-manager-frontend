import { apiFetch } from './apiClient'

export function getColumnsByBoard(boardId) {
  return apiFetch(`/columns/board/${boardId}`)
}

export function createColumn(name, columnOrder, boardId) {
  return apiFetch('/columns', {
    method: 'POST',
    body: JSON.stringify({ name, columnOrder, boardId }),
  })
}

export function changeColumnOrder(columnId, newOrder) {
  return apiFetch('/columns/order', {
    method: 'PUT',
    body: JSON.stringify({ columnId, newOrder }),
  })
}