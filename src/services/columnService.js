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

export function renameColumn(columnId, newName) {
  return apiFetch('/columns/rename', {
    method: 'PUT',
    body: JSON.stringify({ columnId, newName }),
  })
}

export function deleteColumn(columnId) {
  return apiFetch(`/columns/${columnId}`, { method: 'DELETE' })
}
