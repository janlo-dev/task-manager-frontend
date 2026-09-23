import { useState, useEffect } from 'react'
import { getMyBoards, createBoard, renameBoard, deleteBoard } from '../services/boardService'
import InlineEdit from './InlineEdit'

function BoardList({ onSelectBoard }) {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [newBoardName, setNewBoardName] = useState('')
  const [creating, setCreating] = useState(false)

  const loadBoards = () => {
    setLoading(true)
    getMyBoards()
      .then((data) => setBoards(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBoards()
  }, [])

  const handleCreateBoard = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const nextOrder = boards.length === 0 ? 0 : Math.max(...boards.map((b) => b.boardOrder)) + 1
      await createBoard(newBoardName, nextOrder)
      setNewBoardName('')
      loadBoards()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleRenameBoard = async (boardId, newName) => {
    // 1. Actualizamos la UI al instante (optimistic update)
    setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, name: newName } : b)))

    // 2. Persistimos en el backend
    setError(null)
    try {
      await renameBoard(boardId, newName)
    } catch (err) {
      setError(err.message)
      loadBoards() // si falla, recargamos los datos reales
    }
  }

  const handleDeleteBoard = async (board) => {
    if (!window.confirm(`¿Borrar el tablero «${board.name}» y todo su contenido? No se puede deshacer.`)) return

    setBoards((prev) => prev.filter((b) => b.id !== board.id))

    setError(null)
    try {
      await deleteBoard(board.id)
    } catch (err) {
      setError(err.message)
      loadBoards()
    }
  }

  if (loading) return <p className="text-gray-500 text-center mt-8">Cargando tableros...</p>

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Mis tableros</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {boards.length === 0 ? (
        <p className="text-gray-500 mb-4">No tienes ningún tablero todavía.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6" style={{ listStyle: 'none', padding: 0 }}>
          {boards.map((board) => (
            <li
              key={board.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all"
            >
              <InlineEdit
                value={board.name}
                onSave={(newName) => handleRenameBoard(board.id, newName)}
                renderView={(startEditing) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectBoard(board.id)}
                      className="flex-1 text-left font-semibold text-gray-800 hover:text-blue-600"
                    >
                      {board.name}
                    </button>
                    <button
                      onClick={startEditing}
                      title="Renombrar tablero"
                      className="text-sm text-gray-400 hover:text-gray-700"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteBoard(board)}
                      title="Borrar tablero"
                      className="text-sm text-gray-400 hover:text-red-600"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              />
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreateBoard} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex gap-2">
        <input
          type="text"
          placeholder="Nombre del nuevo tablero"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          required
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-blue-600 text-white font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {creating ? 'Creando...' : '+ Crear tablero'}
        </button>
      </form>
    </div>
  )
}

export default BoardList