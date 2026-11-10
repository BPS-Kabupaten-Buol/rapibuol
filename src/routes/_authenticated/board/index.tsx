import { createFileRoute } from '@tanstack/react-router'
import { BoardPage } from '@/features/board'

export const Route = createFileRoute('/_authenticated/board/')({
  component: BoardPage,
})
