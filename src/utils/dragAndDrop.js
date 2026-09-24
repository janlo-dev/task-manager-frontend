// Lógica pura del drag-and-drop del tablero: a partir del result de @hello-pangea/dnd y del estado
// actual decide qué ha pasado y calcula el nuevo estado, sin efectos secundarios ni mutar la entrada.
// BoardDetail se encarga de aplicarlo (setState) y de persistirlo en el backend.
//
// Devuelve una de estas formas:
//   { type: 'none' }
//   { type: 'column', columns, columnId, newIndex }
//   { type: 'task', tasksByColumn, taskId, destColumnId }
export function computeDragResult(result, columns, tasksByColumn) {
  const { source, destination, draggableId, type } = result

  if (!destination) return { type: 'none' } // se soltó fuera de cualquier zona válida

  if (type === 'column') {
    if (source.index === destination.index) return { type: 'none' } // no cambió de posición

    const reordered = Array.from(columns)
    const [moved] = reordered.splice(source.index, 1)
    reordered.splice(destination.index, 0, moved)

    return { type: 'column', columns: reordered, columnId: draggableId, newIndex: destination.index }
  }

  if (type === 'task') {
    // El reordenamiento dentro de la misma columna se implementará más adelante
    if (source.droppableId === destination.droppableId) return { type: 'none' }

    const sourceTasks = Array.from(tasksByColumn[source.droppableId] ?? [])
    const destTasks = Array.from(tasksByColumn[destination.droppableId] ?? [])
    const destColumn = columns.find((c) => String(c.id) === destination.droppableId)

    // La tarea va siempre al final de la columna destino, porque el backend
    // no tiene orden de tareas dentro de una columna
    const [moved] = sourceTasks.splice(source.index, 1)
    destTasks.push({ ...moved, columnId: destColumn.id })

    return {
      type: 'task',
      tasksByColumn: {
        ...tasksByColumn,
        [source.droppableId]: sourceTasks,
        [destination.droppableId]: destTasks,
      },
      taskId: moved.id,
      destColumnId: destColumn.id,
    }
  }

  return { type: 'none' }
}
