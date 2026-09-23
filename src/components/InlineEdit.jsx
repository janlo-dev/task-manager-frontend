import { useState, useRef, useEffect } from 'react'

// Edición inline tipo Trello: renderView pinta el texto en reposo y recibe startEditing
// para abrir el input. Enter o perder el foco confirman; Escape cancela.
function InlineEdit({ value, onSave, renderView, multiline = false, allowEmpty = false, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)
  const finishedRef = useRef(false) // evita guardar dos veces (Enter + el blur que le sigue)

  useEffect(() => {
    if (editing) {
      finishedRef.current = false
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const startEditing = () => {
    setDraft(value ?? '')
    setEditing(true)
  }

  const finish = (save) => {
    if (finishedRef.current) return
    finishedRef.current = true
    setEditing(false)

    if (!save) return
    const newValue = draft.trim()
    if (newValue === (value ?? '').trim()) return // sin cambios
    if (!newValue && !allowEmpty) return
    onSave(newValue)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !(multiline && e.shiftKey)) {
      e.preventDefault()
      finish(true)
    } else if (e.key === 'Escape') {
      finish(false)
    }
  }

  if (!editing) return renderView(startEditing)

  const Input = multiline ? 'textarea' : 'input'
  return (
    <Input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => finish(true)}
      onClick={(e) => e.stopPropagation()}
      rows={multiline ? 3 : undefined}
      className={`w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  )
}

export default InlineEdit
