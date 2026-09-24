import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest' // toBeInTheDocument, toHaveTextContent, etc. en todos los tests

afterEach(() => {
  cleanup()
})
