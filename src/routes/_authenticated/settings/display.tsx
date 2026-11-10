import { createFileRoute, redirect } from '@tanstack/react-router'

// Belum diimplementasikan; jangan tampilkan halaman scaffold.
export const Route = createFileRoute('/_authenticated/settings/display')({
  beforeLoad: () => {
    throw redirect({ to: '/settings/account', replace: true })
  },
})
