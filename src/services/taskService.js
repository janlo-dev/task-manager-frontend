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

export function updateTaskDescription(taskId, newDescription) {
  return apiFetch('/tasks/description', {
    method: 'PUT',
    body: JSON.stringify({ taskId, newDescription }),
  })
}

export function deleteTask(taskId) {
  return apiFetch(`/tasks/${taskId}`, { method: 'DELETE' })
}

export function assignTask(taskId, assignedUserId) {
  return apiFetch('/tasks/assign', {
    method: 'PUT',
    body: JSON.stringify({ taskId, assignedUserId }),
  })
}
