import { createContext, useContext, useState } from 'react'
import type {
  TeamWithLeader,
  CreateTeamForm,
  UpdateTeamForm,
} from '../data/schema'
import { useTeams as useTeamsData } from '../hooks'

interface TeamsDialogContextType {
  isCreateOpen: boolean
  onCreateOpen: (open: boolean) => void
  isEditOpen: boolean
  onEditDialogOpen: (open: boolean) => void
  isDeleteOpen: boolean
  onDeleteDialogOpen: (open: boolean) => void
  isMembersOpen: boolean
  onMembersOpen: (open: boolean) => void
  selectedTeam: TeamWithLeader | null
  setSelectedTeam: (team: TeamWithLeader | null) => void
  teams: TeamWithLeader[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createTeam: (data: CreateTeamForm) => Promise<unknown>
  updateTeam: (id: number, data: UpdateTeamForm) => Promise<unknown>
  deleteTeam: (id: number) => Promise<void>
  deleteTeams: (ids: number[]) => Promise<void>
}

const TeamsDialogContext = createContext<TeamsDialogContextType | undefined>(
  undefined
)

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<TeamWithLeader | null>(null)

  const {
    teams,
    isLoading,
    error,
    refetch,
    createTeam,
    updateTeam,
    deleteTeam,
    deleteTeams,
  } = useTeamsData()

  return (
    <TeamsDialogContext.Provider
      value={{
        isCreateOpen,
        onCreateOpen: setIsCreateOpen,
        isEditOpen,
        onEditDialogOpen: setIsEditOpen,
        isDeleteOpen,
        onDeleteDialogOpen: setIsDeleteOpen,
        isMembersOpen,
        onMembersOpen: setIsMembersOpen,
        selectedTeam,
        setSelectedTeam,
        teams,
        isLoading,
        error,
        refetch,
        createTeam,
        updateTeam,
        deleteTeam,
        deleteTeams,
      }}
    >
      {children}
    </TeamsDialogContext.Provider>
  )
}

export function useTeamDialog() {
  const context = useContext(TeamsDialogContext)
  if (!context) {
    throw new Error('useTeamDialog must be used within TeamsProvider')
  }
  return context
}
