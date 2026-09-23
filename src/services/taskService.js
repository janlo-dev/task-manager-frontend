import { apiFetch } from './apiClient'

export function getTasksByColumn(columnId) {
  return apiFetch(`/tasks?columnId=${columnId}`)
}

export function createTask(title, description, columnId) {
  return apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, description, columnId }),
  })
}

export function moveTask(taskId, newColumnId) {
  return apiFetch('/tasks/move', {
    method: 'PUT',
    body: JSON.stringify({ taskId, newColumnId }),
  })
}
