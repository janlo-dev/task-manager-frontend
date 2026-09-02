import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { getColumnsByBoard, createColumn, changeColumnOrder } from '../services/columnService'
import ColumnCard from './ColumnCard'

function BoardDetail({ boardId, onBack }) {
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [newColumnName, setNewColumnName] = useState('')
  const [creating, setCreating] = useState(false)

  const loadColumns = () => {
    setLoading(true)
    getColumnsByBoard(boardId)
      .then((data) => setColumns(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadColumns()
  }, [boardId])

  const handleCreateColumn = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const nextOrder = columns.length
      await createColumn(newColumnName, nextOrder, boardId)
      setNewColumnName('')
      loadColumns()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result

    if (!destination) return // se soltó fuera de cualquier zona válida
    if (source.index === destination.index) return // no cambió de posición

    // 1. Actualizamos la UI al instante (optimistic update)
    const reordered = Array.from(columns)
    const [moved] = reordered.splice(source.index, 1)
    reordered.splice(destination.index, 0, moved)
    setColumns(reordered)  // 1. Actualiza la pantalla al instante

    // 2. Persistimos el nuevo orden en el backend
    try {
      await changeColumnOrder(draggableId, destination.index) // 2. Luego persiste en el backend
    } catch (err) {
      setError(err.message)
      loadColumns() // si falla, recargamos el orden real desde el servidor
    }
  }

  if (loading) return <p className="text-gray-500 text-center mt-8">Cargando columnas...</p>

  return (
    <div className="px-4 mt-4">
      <button
        onClick={onBack}
        className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1"
      >
        ← Volver a mis tableros
      </button>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board-columns" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 overflow-x-auto pb-4 items-start"
            >
              {columns.map((column, index) => (
                <Draggable key={column.id} draggableId={column.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={snapshot.isDragging ? 'opacity-80' : ''}
                    >
                      <ColumnCard column={column} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              <form
                onSubmit={handleCreateColumn}
                className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 w-72 shrink-0 space-y-2"
              >
                <input
                  type="text"
                  placeholder="Nombre de la columna"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  required
                  className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full text-sm bg-gray-700 text-white font-medium py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creando...' : '+ Añadir columna'}
                </button>
              </form>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

export default BoardDetail