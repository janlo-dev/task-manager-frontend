import { useState, useEffect } from 'react'
import { getMyBoards } from '../services/boardService'

function BoardList({onSelectBoard }) {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMyBoards()
      .then((data) => setBoards(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Cargando tableros...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h2>Mis tableros</h2>
      {boards.length === 0 ? (
        <p>No tienes ningún tablero todavía.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {boards.map((board) => (
            <li key={board.id}>
               <button onClick={() => onSelectBoard(board.id)}>
                    {board.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BoardList