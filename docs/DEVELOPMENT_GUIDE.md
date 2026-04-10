# Development Guide: Adding New Features & Pages

This guide will walk you through adding new features and pages to the Rapibuol Admin Dashboard project.

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Project Structure](#project-structure)
3. [Tech Stack](#tech-stack)
4. [Adding a New Page](#adding-a-new-page)
5. [Adding New Features](#adding-new-features)
6. [Working with Forms](#working-with-forms)
7. [Working with Data & API](#working-with-data--api)
8. [State Management](#state-management)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)

---

## Project Architecture

### High-Level Overview

```
┌─────────────────────────────────────────┐
│      TanStack Router (Routing)          │
├─────────────────────────────────────────┤
│   React Components (UI Layer)           │
├─────────────────────────────────────────┤
│  React Query (Data Fetching/Caching)    │
├─────────────────────────────────────────┤
│   Supabase Client (Backend)             │
├─────────────────────────────────────────┤
│    Zustand (State Management)           │
└─────────────────────────────────────────┘
```

### Key Principles

- **Feature-based Structure**: Code organized by features/modules, not by type
- **Component Composition**: Reusable UI components with clear responsibilities
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Separation of Concerns**: Data fetching, UI rendering, and business logic separated
- **Responsive Design**: Mobile-first approach with Tailwind CSS

---

## Project Structure

```
src/
├── features/              # Feature modules (main code goes here)
│   ├── auth/             # Authentication feature
│   ├── users/            # Users management feature
│   ├── tasks/            # Tasks management feature
│   ├── dashboard/        # Dashboard feature
│   ├── settings/         # Settings feature
│   └── [new-feature]/    # Your new feature goes here
│
├── routes/               # TanStack Router file-based routing
│   ├── (auth)/           # Auth routes group
│   ├── (errors)/         # Error routes group
│   ├── _authenticated/   # Protected routes group
│   └── __root.tsx        # Root route
│
├── components/           # Shared components
│   ├── ui/              # Base UI components (Shadcn)
│   ├── layout/          # Layout components
│   ├── data-table/      # Data table components
│   └── [custom]/        # Custom components
│
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions & helpers
├── context/             # React Context providers
├── stores/              # Zustand stores
├── config/              # Configuration files
├── styles/              # Global styles
└── main.tsx             # App entry point
```

### Feature Structure Pattern

Each feature follows this standard structure:

```
features/[feature-name]/
├── components/          # Feature-specific components
│   ├── [name]-table.tsx
│   ├── [name]-dialog.tsx
│   ├── [name]-provider.tsx
│   └── [name]-columns.tsx
│
├── hooks/              # Custom hooks for this feature
│   ├── use-[resource].ts
│   └── index.ts
│
├── data/               # Data schemas and types
│   └── schema.ts
│
├── api/                # API calls (optional)
│   └── [resource].ts
│
└── index.tsx          # Main feature component export
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Components** | Shadcn UI + Radix UI | Pre-built accessible components |
| **Styling** | Tailwind CSS + CVA | Utility-first CSS framework |
| **Routing** | TanStack Router v1 | File-based routing system |
| **Data Fetching** | React Query v5 | Server state management |
| **State Management** | Zustand | Client state management |
| **Forms** | React Hook Form | Form state management |
| **Validation** | Zod | Schema validation |
| **Backend/Database** | Supabase | PostgreSQL + Auth |
| **HTTP Client** | Axios | API requests |
| **Build Tool** | Vite | Fast build and dev server |
| **Type Checking** | TypeScript | Static type safety |

---

## Adding a New Page

### Step 1: Create Feature Directory

Create a new feature directory in `src/features/[feature-name]/`:

```bash
mkdir -p src/features/projects
mkdir -p src/features/projects/components
mkdir -p src/features/projects/hooks
mkdir -p src/features/projects/data
```

### Step 2: Define Data Schema

Create `src/features/projects/data/schema.ts`:

```typescript
import { z } from 'zod'

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().nullable(),
  status: z.enum(['active', 'paused', 'archived']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  owner: z.string(),
  createdAt: z.coerce.date(),
})

export type Project = z.infer<typeof projectSchema>

// Form schema (can differ from data schema)
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'archived']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
})

export type CreateProjectForm = z.infer<typeof createProjectSchema>
```

### Step 3: Create Custom Hook for Data Fetching

Create `src/features/projects/hooks/use-projects.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Project, CreateProjectForm } from '../data/schema'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setProjects(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = async (formData: CreateProjectForm) => {
    try {
      const { data, error: createError } = await supabase
        .from('projects')
        .insert([formData])
        .select()
        .single()

      if (createError) throw createError

      await fetchProjects()
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create project')
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      await fetchProjects()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete project')
    }
  }

  return {
    projects,
    isLoading,
    error,
    createProject,
    deleteProject,
    refetch: fetchProjects,
  }
}
```

Create `src/features/projects/hooks/index.ts`:

```typescript
export { useProjects } from './use-projects'
```

### Step 4: Create Table Columns

Create `src/features/projects/components/projects-columns.tsx`:

```typescript
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import type { Project } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const projectsColumns: ColumnDef<Project>[] = [
  {
    accessorKey: 'name',
    header: 'Project Name',
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        active: 'default',
        paused: 'secondary',
        archived: 'outline',
      }
      return (
        <Badge variant={variants[status] || 'default'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    cell: ({ row }) => new Date(row.getValue('startDate')).toLocaleDateString(),
  },
  {
    accessorKey: 'owner',
    header: 'Owner',
    cell: ({ row }) => <span>{row.getValue('owner')}</span>,
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
```

### Step 5: Create Main Feature Component

Create `src/features/projects/index.tsx`:

```typescript
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useProjects } from './hooks'
import { ProjectsDialogs } from './components/projects-dialogs'
import { ProjectsPrimaryButtons } from './components/projects-primary-buttons'
import { ProjectsProvider } from './components/projects-provider'
import { ProjectsTable } from './components/projects-table'

const route = getRouteApi('/_authenticated/projects/')

export function Projects() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { projects, isLoading, error } = useProjects()

  return (
    <ProjectsProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Projects</h2>
            <p className='text-muted-foreground'>
              Manage your projects and their status here.
            </p>
          </div>
          <ProjectsPrimaryButtons />
        </div>
        {error ? (
          <div className='text-red-500'>{error}</div>
        ) : (
          <ProjectsTable
            data={projects}
            search={search}
            navigate={navigate}
            isLoading={isLoading}
          />
        )}
      </Main>

      <ProjectsDialogs />
    </ProjectsProvider>
  )
}
```

### Step 6: Create Route File

Create `src/routes/_authenticated/projects/index.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { Projects } from '@/features/projects'

export const Route = createFileRoute('/_authenticated/projects/')({
  component: Projects,
})
```

### Step 7: Update Sidebar Navigation

Edit `src/components/layout/app-sidebar.tsx` and add your new feature to the navigation menu:

```typescript
// Inside the navigation items array
{
  title: 'Projects',
  icon: Folder,
  href: '/projects',
  label: 'Pro',
}
```

---

## Adding New Features

### Adding a Modal/Dialog

Create `src/features/projects/components/projects-action-dialog.tsx`:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createProjectSchema, type CreateProjectForm } from '../data/schema'
import { useProjectDialog } from './projects-provider'
import { useProjects } from '../hooks'
import { toast } from 'sonner'

export function ProjectsActionDialog() {
  const { isOpen, onOpenChange } = useProjectDialog()
  const { createProject } = useProjects()
  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
  })

  const onSubmit = async (data: CreateProjectForm) => {
    try {
      await createProject(data)
      toast.success('Project created successfully')
      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create project')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Add a new project to your workspace</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter project name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='startDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' className='w-full'>
              Create Project
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

### Adding a Provider for Dialog State

Create `src/features/projects/components/projects-provider.tsx`:

```typescript
import { createContext, useContext, useState } from 'react'

interface ProjectDialogContextType {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const ProjectDialogContext = createContext<ProjectDialogContextType | undefined>(
  undefined
)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ProjectDialogContext.Provider
      value={{
        isOpen,
        onOpenChange: setIsOpen,
      }}
    >
      {children}
    </ProjectDialogContext.Provider>
  )
}

export function useProjectDialog() {
  const context = useContext(ProjectDialogContext)
  if (!context) {
    throw new Error('useProjectDialog must be used within ProjectsProvider')
  }
  return context
}
```

---

## Working with Forms

### Using React Hook Form with Shadcn UI

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { myFormSchema, type MyFormType } from './schema'

export function MyForm() {
  const form = useForm<MyFormType>({
    resolver: zodResolver(myFormSchema),
    defaultValues: {
      name: '',
      status: 'active',
    },
  })

  const onSubmit = async (data: MyFormType) => {
    try {
      // Handle form submission
      console.log(data)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder='John Doe' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='status'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>Submit</Button>
      </form>
    </Form>
  )
}
```

---

## Working with Data & API

### Using Supabase Client

```typescript
// Basic queries
const { data, error } = await supabase
  .from('table_name')
  .select('*')

// Insert
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: 'value' }])
  .select()

// Update
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', 'value')
  .select()

// Delete
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', 'value')

// Complex queries with joins
const { data, error } = await supabase
  .from('table_name')
  .select(`
    id,
    name,
    related_table (
      id,
      name
    )
  `)
```

### Handling Errors

```typescript
import { AxiosError } from 'axios'
import { toast } from 'sonner'

try {
  // Your API call
} catch (error) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      toast.error('Session expired!')
      // Redirect to login
    } else if (error.response?.status === 403) {
      toast.error('Access denied')
    } else if (error.response?.status === 404) {
      toast.error('Resource not found')
    } else {
      toast.error(error.response?.data?.message || 'An error occurred')
    }
  }
}
```

---

## State Management

### Using Zustand for Global State

Create `src/stores/app-store.ts`:

```typescript
import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}))
```

Using the store:

```typescript
import { useAppStore } from '@/stores/app-store'

export function MyComponent() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen)
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen)

  return (
    <button onClick={() => setSidebarOpen(!sidebarOpen)}>
      Toggle Sidebar
    </button>
  )
}
```

### Using React Context for Feature-Specific State

```typescript
import { createContext, useContext, useState } from 'react'

interface FeatureContextType {
  value: string
  setValue: (value: string) => void
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined)

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState('')

  return (
    <FeatureContext.Provider value={{ value, setValue }}>
      {children}
    </FeatureContext.Provider>
  )
}

export function useFeature() {
  const context = useContext(FeatureContext)
  if (!context) {
    throw new Error('useFeature must be used within FeatureProvider')
  }
  return context
}
```

---

## Best Practices

### 1. Component Organization

- Keep components focused and single-responsibility
- Extract complex logic into custom hooks
- Use composition over inheritance

```typescript
// ❌ Don't: Complex monolithic component
function UserList() {
  // 300+ lines of logic
}

// ✅ Do: Separated concerns
function UserList() {
  return (
    <>
      <UserListHeader />
      <UserListTable />
    </>
  )
}
```

### 2. Type Safety

- Always define schemas with Zod
- Use TypeScript inference (`z.infer`)
- Export types explicitly

```typescript
// ✅ Good: Complete type safety
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
})
type User = z.infer<typeof userSchema>

export { userSchema, type User }
```

### 3. Error Handling

- Always wrap async operations in try-catch
- Use toast notifications for user feedback
- Log errors for debugging

```typescript
// ✅ Good: Proper error handling
try {
  const result = await fetchData()
  toast.success('Data fetched successfully')
} catch (error) {
  console.error('Fetch failed:', error)
  toast.error(error instanceof Error ? error.message : 'Unknown error')
}
```

### 4. Performance Optimization

- Use `useCallback` for stable function references
- Memoize expensive computations
- Lazy load routes and components

```typescript
// ✅ Good: Memoized callbacks
const handleSubmit = useCallback(async (data) => {
  await submitForm(data)
}, [])

// ✅ Good: Lazy loaded routes
const Projects = lazy(() => import('@/features/projects'))
```

### 5. Naming Conventions

- Features in `camelCase` with descriptive names
- Components in `PascalCase`
- Custom hooks prefixed with `use`
- Files match their main export

```
features/
├── projectManagement/
│   ├── components/
│   │   ├── ProjectTable.tsx
│   │   ├── ProjectDialog.tsx
│   │   └── ProjectProvider.tsx
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   └── useProjectFilters.ts
│   └── data/
│       └── schema.ts
```

### 6. Documentation

- Document complex logic with comments
- Add JSDoc comments for public APIs
- Keep README and guides updated

```typescript
/**
 * Fetches projects with filters
 * @param filters - Filter criteria for projects
 * @returns Promise with project list and metadata
 */
export async function fetchProjects(filters: ProjectFilters) {
  // Implementation
}
```

---

## Common Patterns

### Pattern 1: Data Table with Actions

```typescript
// 1. Define columns with actions
export const columns: ColumnDef<DataType>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    id: 'actions',
    cell: ({ row }) => <RowActions row={row} />,
  },
]

// 2. Create row actions component
function RowActions({ row }: { row: Row<DataType> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => edit(row.original.id)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => delete(row.original.id)}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Pattern 2: Form Dialog

```typescript
export function FormDialog({ isOpen, onOpenChange }: DialogProps) {
  const form = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormType) => {
    try {
      await submitData(data)
      toast.success('Success!')
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast.error('Failed!')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Form fields */}
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 3: Custom Hook for Feature Logic

```typescript
export function useFeatureLogic() {
  const [data, setData] = useState<DataType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchData()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const create = useCallback(async (item: DataType) => {
    try {
      await createData(item)
      await fetch()
    } catch (err) {
      throw err
    }
  }, [fetch])

  return { data, loading, error, create, fetch }
}
```

### Pattern 4: Feature Provider Pattern

```typescript
// Create context
interface FeatureContextType {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedItem: DataType | null
  setSelectedItem: (item: DataType | null) => void
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined)

// Provider component
export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DataType | null>(null)

  return (
    <FeatureContext.Provider
      value={{ isOpen, onOpenChange: setIsOpen, selectedItem, setSelectedItem }}
    >
      {children}
    </FeatureContext.Provider>
  )
}

// Hook to use context
export function useFeature() {
  const context = useContext(FeatureContext)
  if (!context) {
    throw new Error('useFeature must be used within FeatureProvider')
  }
  return context
}

// Usage
export function FeatureComponent() {
  return (
    <FeatureProvider>
      <MainContent />
      <Dialog />
    </FeatureProvider>
  )
}

function MainContent() {
  const { onOpenChange } = useFeature()
  return <button onClick={() => onOpenChange(true)}>Add</button>
}

function Dialog() {
  const { isOpen, onOpenChange } = useFeature()
  return <DialogContent open={isOpen} onOpenChange={onOpenChange} />
}
```

---

## Testing Your Implementation

### Checklist for New Features

- [ ] Created feature directory with proper structure
- [ ] Defined data schemas with Zod
- [ ] Created custom hooks for data fetching
- [ ] Built UI components with Shadcn components
- [ ] Added TypeScript types throughout
- [ ] Created route file(s) in `src/routes`
- [ ] Updated sidebar navigation if needed
- [ ] Tested form submissions and error handling
- [ ] Added proper error messages and toasts
- [ ] Tested responsive design on mobile
- [ ] Verified accessibility (keyboard navigation, ARIA labels)
- [ ] Added loading and empty states
- [ ] Checked for console errors and warnings

---

## Useful Resources

- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Shadcn UI Components](https://ui.shadcn.com)
- [Zod Documentation](https://zod.dev)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

## Getting Help

If you encounter issues:

1. Check the existing features in `src/features/` for similar patterns
2. Review the error messages in console and network tabs
3. Verify your Supabase tables and policies
4. Check TypeScript types and Zod schema definitions
5. Refer to the tech stack documentation

---

**Last Updated**: 2024
**Project**: Rapibuol Admin Dashboard
**Version**: 2.2.1+