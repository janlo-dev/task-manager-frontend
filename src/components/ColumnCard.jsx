import { useState } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'

function ColumnCard({ column, tasks, onCreateTask, dragHandleProps }) {
  const [error, setError] = useState(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      await onCreateTask(column.id, title, description)
      setTitle('')
      setDescription('')
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-72 shrink-0 flex flex-col">
      {/* Solo el título es el asa para arrastrar la columna */}
      <h3
        {...dragHandleProps}
        className="font-bold text-gray-700 uppercase text-sm tracking-wide mb-3 cursor-grab"
      >
        {column.name}
      </h3>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Droppable droppableId={String(column.id)} type="task">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 flex-1 min-h-16 rounded-md transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-sm text-gray-400 italic">Sin tareas</p>
            )}

            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-white border border-gray-200 rounded-md p-3 shadow-sm ${
                      snapshot.isDragging ? 'opacity-80' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-800">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(task.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <form onSubmit={handleCreateTask} className="mt-3 space-y-2 pt-3 border-t border-gray-200">
        <input
          type="text"
          placeholder="Título de la tarea"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="w-full text-sm bg-blue-600 text-white font-medium py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {creating ? 'Creando...' : '+ Añadir tarea'}
        </button>
      </form>
    </div>
  )
}

export default ColumnCard
