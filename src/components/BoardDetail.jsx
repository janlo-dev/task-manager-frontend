import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { getColumnsByBoard, createColumn, changeColumnOrder, renameColumn, deleteColumn } from '../services/columnService'
import { getTasksByColumn, createTask, moveTask, updateTaskDescription, deleteTask, assignTask } from '../services/taskService'
import { getBoardMembers, inviteBoardMember, removeBoardMember } from '../services/boardMemberService'
import { computeDragResult } from '../utils/dragAndDrop'
import ColumnCard from './ColumnCard'

function BoardDetail({ boardId, onBack }) {
  const [columns, setColumns] = useState([])
  const [tasksByColumn, setTasksByColumn] = useState({}) // { columnId: [tasks] }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [newColumnName, setNewColumnName] = useState('')
  const [creating, setCreating] = useState(false)

  // Miembros: única fuente de verdad, se pasa por prop a ColumnCard para el <select> de asignación
  const [members, setMembers] = useState([])
  const [showMembers, setShowMembers] = useState(false)
  const [membersError, setMembersError] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const loadBoard = async () => {
    setLoading(true)
    try {
      const cols = await getColumnsByBoard(boardId)
      const taskLists = await Promise.all(cols.map((c) => getTasksByColumn(c.id)))
      setColumns(cols)
      setTasksByColumn(Object.fromEntries(cols.map((c, i) => [c.id, taskLists[i]])))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Separada de loadBoard: si falla una operación sobre tareas no hace falta volver a pedir los miembros
  const loadMembers = async () => {
    try {
      setMembers(await getBoardMembers(boardId))
    } catch (err) {
      setMembersError(err.message)
    }
  }

  useEffect(() => {
    loadBoard()
    loadMembers()
  }, [boardId])

  const handleInviteMember = async (e) => {
    e.preventDefault()
    const email = inviteEmail.trim()
    setInviting(true)
    setMembersError(null)

    // 1. Fila provisional: el backend no devuelve name/email al invitar
    setMembers((prev) => [
      ...prev,
      { memberId: `pending-${email}`, email, name: email, role: 'MEMBER', pending: true },
    ])

    // 2. Invitamos y recargamos para obtener los datos reales del nuevo miembro
    try {
      await inviteBoardMember(boardId, email)
      setInviteEmail('')
      await loadMembers()
    } catch (err) {
      setMembersError(err.message) // error del backend tal cual (no existe, ya es miembro, 403...)
      loadMembers()
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`¿Expulsar a «${member.name}» del tablero?`)) return

    setMembers((prev) => prev.filter((m) => m.memberId !== member.memberId))

    setMembersError(null)
    try {
      await removeBoardMember(boardId, member.userId)
      // El backend ya desasigna sus tareas; lo reflejamos en local para no esperar a un loadBoard()
      setTasksByColumn((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([columnId, tasks]) => [
            columnId,
            tasks.map((t) => (t.assignedUserId === member.userId ? { ...t, assignedUserId: null } : t)),
          ])
        )
      )
    } catch (err) {
      setMembersError(err.message)
      loadMembers()
    }
  }

  const handleCreateColumn = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const nextOrder = columns.length === 0 ? 0 : Math.max(...columns.map((c) => c.columnOrder)) + 1
      await createColumn(newColumnName, nextOrder, boardId)
      setNewColumnName('')
      loadBoard()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  // No captura el error: lo relanza para que ColumnCard lo muestre en su formulario
  const handleCreateTask = async (columnId, title, description) => {
    await createTask(title, description, columnId)
    const tasks = await getTasksByColumn(columnId) // recargamos solo esa columna
    setTasksByColumn((prev) => ({ ...prev, [columnId]: tasks }))
  }

  const handleRenameColumn = async (columnId, newName) => {
    // 1. Actualizamos la UI al instante (optimistic update)
    setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, name: newName } : c)))

    // 2. Persistimos en el backend
    setError(null)
    try {
      await renameColumn(columnId, newName)
    } catch (err) {
      setError(err.message)
      loadBoard() // si falla, recargamos los datos reales
    }
  }

  const handleDeleteColumn = async (column) => {
    if (!window.confirm(`¿Borrar la columna «${column.name}» y todo su contenido? No se puede deshacer.`)) return

    setColumns((prev) => prev.filter((c) => c.id !== column.id))
    setTasksByColumn((prev) => {
      const next = { ...prev }
      delete next[column.id]
      return next
    })

    setError(null)
    try {
      await deleteColumn(column.id)
    } catch (err) {
      setError(err.message)
      loadBoard()
    }
  }

  const handleUpdateTaskDescription = async (columnId, taskId, newDescription) => {
    setTasksByColumn((prev) => ({
      ...prev,
      [columnId]: prev[columnId].map((t) => (t.id === taskId ? { ...t, description: newDescription } : t)),
    }))

    setError(null)
    try {
      await updateTaskDescription(taskId, newDescription)
    } catch (err) {
      setError(err.message)
      loadBoard()
    }
  }

  const handleAssignTask = async (columnId, taskId, assignedUserId) => {
    setTasksByColumn((prev) => ({
      ...prev,
      [columnId]: prev[columnId].map((t) => (t.id === taskId ? { ...t, assignedUserId } : t)),
    }))

    setError(null)
    try {
      await assignTask(taskId, assignedUserId)
    } catch (err) {
      setError(err.message) // p. ej. el usuario no es miembro del tablero
      loadBoard()
    }
  }

  const handleDeleteTask = async (columnId, task) => {
    if (!window.confirm(`¿Borrar la tarea «${task.title}»? No se puede deshacer.`)) return

    setTasksByColumn((prev) => ({
      ...prev,
      [columnId]: prev[columnId].filter((t) => t.id !== task.id),
    }))

    setError(null)
    try {
      await deleteTask(task.id)
    } catch (err) {
      setError(err.message)
      loadBoard()
    }
  }

  const handleDragEnd = async (result) => {
    // Qué ha pasado y cuál es el nuevo estado lo decide la función pura (ver utils/dragAndDrop.js)
    const action = computeDragResult(result, columns, tasksByColumn)

    if (action.type === 'column') {
      setColumns(action.columns) // 1. Actualiza la pantalla al instante (optimistic update)

      setError(null)
      try {
        await changeColumnOrder(action.columnId, action.newIndex) // 2. Luego persiste en el backend
      } catch (err) {
        setError(err.message)
        loadBoard() // si falla, recargamos el orden real desde el servidor
      }
    }

    if (action.type === 'task') {
      setTasksByColumn(action.tasksByColumn)

      setError(null)
      try {
        await moveTask(action.taskId, action.destColumnId)
      } catch (err) {
        setError(err.message)
        loadBoard() // si falla, recargamos el estado real desde el servidor
      }
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

      <div className="mb-4">
        <button
          onClick={() => setShowMembers(!showMembers)}
          className="text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          {showMembers ? 'Ocultar miembros ▴' : `Ver miembros (${members.length}) ▾`}
        </button>

        {showMembers && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg p-4 shadow-sm max-w-md space-y-3">
            {membersError && <p className="text-sm text-red-600">{membersError}</p>}

            <ul className="space-y-2" style={{ listStyle: 'none', padding: 0 }}>
              {members.map((member) => (
                <li key={member.memberId} className="flex items-center gap-2 text-sm">
                  <span className={`flex-1 ${member.pending ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                    {member.pending ? `${member.email} · invitando...` : member.name}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      member.role === 'OWNER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {member.role}
                  </span>
                  {member.role === 'MEMBER' && !member.pending && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      title="Expulsar del tablero"
                      className="text-sm text-gray-400 hover:text-red-600"
                    >
                      🗑️
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <form onSubmit={handleInviteMember} className="flex gap-2 pt-3 border-t border-gray-200">
              <input
                type="email"
                placeholder="Email del usuario a invitar"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={inviting}
                className="text-sm bg-blue-600 text-white font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {inviting ? 'Invitando...' : 'Invitar'}
              </button>
            </form>
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board-columns" direction="horizontal" type="column">
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
                      className={snapshot.isDragging ? 'opacity-80' : ''}
                    >
                      <ColumnCard
                        column={column}
                        tasks={tasksByColumn[column.id] ?? []}
                        onCreateTask={handleCreateTask}
                        onRenameColumn={handleRenameColumn}
                        onDeleteColumn={handleDeleteColumn}
                        onUpdateTaskDescription={handleUpdateTaskDescription}
                        onDeleteTask={handleDeleteTask}
                        members={members}
                        onAssignTask={handleAssignTask}
                        dragHandleProps={provided.dragHandleProps}
                      />
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