import { useState, useEffect } from 'react'
import { getTasksByColumn, createTask } from '../services/taskService'

function ColumnCard({ column }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const loadTasks = () => {
    setLoading(true)
    getTasksByColumn(column.id)
      .then((data) => setTasks(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTasks()
  }, [column.id])

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      await createTask(title, description, column.id)
      setTitle('')
      setDescription('')
      loadTasks() // recargamos la lista tras crear
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', minWidth: '220px' }}>
      <h3>{column.name}</h3>

      {loading && <p>Cargando tareas...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && (
        tasks.length === 0 ? (
          <p>Sin tareas</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map((task) => (
              <li key={task.id} style={{ marginBottom: '0.75rem' }}>
                <strong>{task.title}</strong>
                <p style={{ margin: '0.25rem 0' }}>{task.description}</p>
                <small style={{ color: '#666' }}>
                  Creada: {new Date(task.createdAt).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        )
      )}

      <form onSubmit={handleCreateTask} style={{ marginTop: '1rem' }}>
        <div>
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <textarea
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" disabled={creating}>
          {creating ? 'Creando...' : '+ Añadir tarea'}
        </button>
      </form>
    </div>
  )
}

export default ColumnCard