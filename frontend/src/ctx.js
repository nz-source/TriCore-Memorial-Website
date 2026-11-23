import { createContext, useContext } from 'react'

// Create application context
export const Ctx = createContext(null)

// Access application context
export const useApp = () => {
  const context = useContext(Ctx)

  if (!context) {
    throw new Error(
      'useApp must be used inside the Ctx.Provider'
    )
  }

  return context
}
