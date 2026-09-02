import { useState, useEffect } from 'react'
import { getColumnsByBoard } from '../services/columnService'
import ColumnCard from './ColumnCard'

function BoardDetail({ boardId, onBack }) {
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getColumnsByBoard(boardId)
      .then((data) => setColumns(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [boardId])

  if (loading) return <p>Cargando columnas...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <button onClick={onBack}>← Volver a mis tableros</button>
      <h2>Columnas</h2>

      {columns.length === 0 ? (
        <p>Este tablero no tiene columnas todavía.</p>
      ) : (
        <div style={{ display: 'flex', gap: '1rem' }}>
          {columns.map((column) => (
            <ColumnCard key={column.id} column={column} />
          ))}
        </div>
      )}
    </div>
  )
}

export default BoardDetail