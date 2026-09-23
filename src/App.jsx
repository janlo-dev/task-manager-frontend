import { useState, useEffect } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import BoardList from './components/BoardList'
import BoardDetail from './components/BoardDetail'
import { isAuthenticated, logout } from './services/authService'
import { getMyBoards } from './services/boardService'
import './App.css'

function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated())
  const [showRegister, setShowRegister] = useState(false)
  const [selectedBoardId, setSelectedBoardId] = useState(null)
  const [boardsChecked, setBoardsChecked] = useState(false)

  useEffect(() => {
    if (loggedIn && !boardsChecked) {
      getMyBoards()
        .then((boards) => {
          // Solo entramos directamente si hay un único tablero; con 2 o más, se muestra la lista
          if (boards.length === 1) {
            setSelectedBoardId(boards[0].id)
          }
        })
        .finally(() => setBoardsChecked(true))
    }
  }, [loggedIn, boardsChecked])

  const handleLogout = () => {
    logout()
    setLoggedIn(false)
    setSelectedBoardId(null)
    setBoardsChecked(false)
  }

  if (loggedIn) {
    return (
      <div>
        <h1>Task Manager</h1>
        <button onClick={handleLogout}>Cerrar sesión</button>

        {!boardsChecked ? (
          // Evita que se vea la lista un instante antes de entrar al único tablero
          <p className="text-gray-500 text-center mt-8">Cargando tableros...</p>
        ) : selectedBoardId ? (
          <BoardDetail
            boardId={selectedBoardId}
            onBack={() => setSelectedBoardId(null)}
          />
        ) : (
          <BoardList onSelectBoard={(id) => setSelectedBoardId(id)} />
        )}
      </div>
    )
  }

  return (
    <div>
      <h1>Task Manager</h1>
      {showRegister ? (
        <Register onRegisterSuccess={() => setLoggedIn(true)} />
      ) : (
        <Login onLoginSuccess={() => setLoggedIn(true)} />
      )}
      <button onClick={() => setShowRegister(!showRegister)}>
        {showRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </button>
    </div>
  )
}

export default App