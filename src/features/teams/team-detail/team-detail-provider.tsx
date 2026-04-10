import { createContext, useContext, type ReactNode } from 'react'

interface TeamDetailContextType {
  placeholder?: string
}

const TeamDetailContext = createContext<TeamDetailContextType | undefined>(
  undefined
)

interface TeamDetailProviderProps {
  children: ReactNode
}

export function TeamDetailProvider({ children }: TeamDetailProviderProps) {
  return (
    <TeamDetailContext.Provider value={{ placeholder: '' }}>
      {children}
    </TeamDetailContext.Provider>
  )
}

export function useTeamDetail() {
  const context = useContext(TeamDetailContext)
  if (!context) {
    throw new Error('useTeamDetail must be used within TeamDetailProvider')
  }
  return context
}
