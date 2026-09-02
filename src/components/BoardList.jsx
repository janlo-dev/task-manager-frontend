import { useState, useEffect } from 'react'
import { getMyBoards, createBoard } from '../services/boardService'

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
      const nextOrder = boards.length
      await createBoard(newBoardName, nextOrder)
      setNewBoardName('')
      loadBoards()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
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
            <li key={board.id}>
              <button
                onClick={() => onSelectBoard(board.id)}
                className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all"
              >
                <span className="font-semibold text-gray-800">{board.name}</span>
              </button>
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