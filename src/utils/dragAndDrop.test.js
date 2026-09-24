import { describe, it, expect } from 'vitest'
import { computeDragResult } from './dragAndDrop'

// El backend usa UUIDs (strings), pero aquí usamos ids numéricos a propósito: así se comprueba que la
// función recupera el id original de la columna y no el droppableId, que siempre es String(column.id)
const columns = [
  { id: 1, name: 'Pendiente' },
  { id: 2, name: 'En curso' },
  { id: 3, name: 'Hecho' },
]

const tasksByColumn = {
  1: [
    { id: 10, title: 'A', columnId: 1 },
    { id: 11, title: 'B', columnId: 1 },
  ],
  2: [{ id: 20, title: 'C', columnId: 2 }],
  3: [],
}

const columnDrag = (from, to) => ({
  type: 'column',
  draggableId: columns[from].id,
  source: { droppableId: 'board-columns', index: from },
  destination: { droppableId: 'board-columns', index: to },
})

const taskDrag = (fromColumn, fromIndex, toColumn, toIndex = 0) => ({
  type: 'task',
  draggableId: `task-${tasksByColumn[fromColumn][fromIndex]?.id}`,
  source: { droppableId: String(fromColumn), index: fromIndex },
  destination: { droppableId: String(toColumn), index: toIndex },
})

describe('computeDragResult', () => {
  describe('casos sin acción', () => {
    it('no hace nada si se suelta fuera de una zona válida', () => {
      const result = { ...columnDrag(0, 1), destination: null }
      expect(computeDragResult(result, columns, tasksByColumn)).toEqual({ type: 'none' })
    })

    it('no hace nada si la columna se suelta en su misma posición', () => {
      expect(computeDragResult(columnDrag(1, 1), columns, tasksByColumn)).toEqual({ type: 'none' })
    })

    it('no hace nada si la tarea se suelta en su misma columna (reordenar aún no está soportado)', () => {
      expect(computeDragResult(taskDrag(1, 0, 1, 1), columns, tasksByColumn)).toEqual({ type: 'none' })
    })
  })

  describe('mover columnas', () => {
    it('mueve una columna hacia delante', () => {
      const action = computeDragResult(columnDrag(0, 2), columns, tasksByColumn)

      expect(action.type).toBe('column')
      expect(action.columns.map((c) => c.id)).toEqual([2, 3, 1])
    })

    it('mueve una columna hacia atrás', () => {
      const action = computeDragResult(columnDrag(2, 0), columns, tasksByColumn)

      expect(action.columns.map((c) => c.id)).toEqual([3, 1, 2])
    })

    it('devuelve el id de la columna y su nuevo índice para persistirlo', () => {
      const action = computeDragResult(columnDrag(0, 2), columns, tasksByColumn)

      expect(action.columnId).toBe(1)
      expect(action.newIndex).toBe(2)
    })

    it('no muta el array de columnas original', () => {
      const before = structuredClone(columns)
      const action = computeDragResult(columnDrag(0, 2), columns, tasksByColumn)

      expect(columns).toEqual(before)
      expect(action.columns).not.toBe(columns)
    })
  })

  describe('mover tareas entre columnas', () => {
    it('quita la tarea de la columna origen', () => {
      const action = computeDragResult(taskDrag(1, 0, 2), columns, tasksByColumn)

      expect(action.type).toBe('task')
      expect(action.tasksByColumn['1'].map((t) => t.id)).toEqual([11])
    })

    it('coloca la tarea al final de la columna destino, aunque se suelte en otra posición', () => {
      const action = computeDragResult(taskDrag(1, 0, 2, 0), columns, tasksByColumn)

      expect(action.tasksByColumn['2'].map((t) => t.id)).toEqual([20, 10])
    })

    it('actualiza el columnId dentro del propio objeto de la tarea', () => {
      const action = computeDragResult(taskDrag(1, 0, 2), columns, tasksByColumn)
      const moved = action.tasksByColumn['2'].find((t) => t.id === 10)

      expect(moved).toEqual({ id: 10, title: 'A', columnId: 2 })
    })

    it('no toca las columnas que no participan en el movimiento', () => {
      const action = computeDragResult(taskDrag(1, 0, 2), columns, tasksByColumn)

      expect(action.tasksByColumn['3']).toBe(tasksByColumn[3])
    })

    it('permite mover a una columna vacía', () => {
      const action = computeDragResult(taskDrag(2, 0, 3), columns, tasksByColumn)

      expect(action.tasksByColumn['2']).toEqual([])
      expect(action.tasksByColumn['3'].map((t) => t.id)).toEqual([20])
    })

    it('permite mover a una columna que aún no tiene entrada en tasksByColumn', () => {
      const withoutColumn3 = { 1: tasksByColumn[1], 2: tasksByColumn[2] }
      const action = computeDragResult(taskDrag(1, 1, 3), columns, withoutColumn3)

      expect(action.tasksByColumn['3'].map((t) => t.id)).toEqual([11])
    })

    it('devuelve taskId y destColumnId con su tipo original (número), no como string', () => {
      const action = computeDragResult(taskDrag(1, 0, 2), columns, tasksByColumn)

      expect(action.taskId).toBe(10)
      expect(action.destColumnId).toBe(2)
    })

    it('no muta el estado original', () => {
      const before = structuredClone(tasksByColumn)
      computeDragResult(taskDrag(1, 0, 2), columns, tasksByColumn)

      expect(tasksByColumn).toEqual(before)
    })
  })
})
