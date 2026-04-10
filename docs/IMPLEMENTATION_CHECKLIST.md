# Implementation Checklist & Troubleshooting Guide

## Quick Start Checklist: Adding a New Feature

### Phase 1: Planning
- [ ] Define the feature scope and requirements
- [ ] Sketch the UI/UX flow
- [ ] Identify data models and relationships
- [ ] Plan API endpoints needed
- [ ] Determine state management approach

### Phase 2: Data & Schema
- [ ] Create Zod schemas in `data/schema.ts`
- [ ] Define TypeScript types from schemas
- [ ] Create form schemas separate from data schemas
- [ ] Add validation rules to schemas
- [ ] Export all types and schemas

### Phase 3: Data Fetching
- [ ] Create custom hook in `hooks/use-[feature].ts`
- [ ] Implement fetch functionality
- [ ] Add error handling with try-catch
- [ ] Implement create/update/delete operations
- [ ] Add loading and error states
- [ ] Export from `hooks/index.ts`

### Phase 4: UI Components
- [ ] Create table columns in `components/[feature]-columns.tsx`
- [ ] Build main table component
- [ ] Create action dialogs for create/edit/delete
- [ ] Build provider component for state management
- [ ] Create primary buttons component
- [ ] Create main feature component (`index.tsx`)

### Phase 5: Routing
- [ ] Create route directory: `src/routes/_authenticated/[feature]/`
- [ ] Create `index.tsx` with route definition
- [ ] Import feature component correctly
- [ ] Test route navigation

### Phase 6: Navigation
- [ ] Add menu item to `src/components/layout/app-sidebar.tsx`
- [ ] Verify navigation link is correct
- [ ] Test sidebar navigation works
- [ ] Check mobile sidebar behavior

### Phase 7: Testing & Refinement
- [ ] Test on desktop browser
- [ ] Test on mobile devices
- [ ] Test keyboard navigation (Tab, Enter)
- [ ] Test form validation
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test empty states
- [ ] Verify accessibility (ARIA labels)
- [ ] Check console for warnings/errors
- [ ] Test with screen reader if possible

### Phase 8: Polish
- [ ] Add proper error messages
- [ ] Add success toast notifications
- [ ] Verify responsive design
- [ ] Check dark mode compatibility
- [ ] Add loading spinners where needed
- [ ] Verify pagination if applicable
- [ ] Add proper TypeScript types everywhere
- [ ] Run linter: `pnpm lint`
- [ ] Run formatter: `pnpm format`

---

## Common Issues & Solutions

### Issue 1: Route Not Found (404)
**Symptoms**: "Page not found" when navigating to new feature

**Solutions**:
1. Check route file exists: `src/routes/_authenticated/[feature]/index.tsx`
2. Verify route name matches: `createFileRoute('/_authenticated/[feature]/')`
3. Restart dev server: `pnpm run dev`
4. Check for typos in route path
5. Verify component is exported from feature's `index.tsx`

```typescript
// ✅ Correct
export const Route = createFileRoute('/_authenticated/projects/')({
  component: Projects,
})

// ❌ Wrong (typo in path)
export const Route = createFileRoute('/_authenticated/project/')({
  component: Projects,
})
```

### Issue 2: Type Errors in Components
**Symptoms**: TypeScript compilation errors or red squiggles

**Solutions**:
1. Ensure all types are exported from `data/schema.ts`
2. Import types correctly using `type` keyword
3. Use `z.infer` for type inference from schemas
4. Check that props match function signature

```typescript
// ✅ Correct
import type { Project } from '../data/schema'

interface Props {
  project: Project
}

// ❌ Wrong (missing type keyword)
import { Project } from '../data/schema'
```

### Issue 3: Data Not Loading
**Symptoms**: Table shows "Loading..." indefinitely or empty

**Solutions**:
1. Check Supabase table exists and has data
2. Verify table name in query: `supabase.from('table_name')`
3. Check Supabase RLS policies allow read access
4. Check network tab for API errors
5. Add console.log to debug fetch function
6. Verify environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

```typescript
// Debug: Add logging
const fetchProjects = useCallback(async () => {
  console.log('Fetching projects...')
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
    
    console.log('Data:', data)
    console.log('Error:', error)
    
    if (error) throw error
    setProjects(data || [])
  } catch (err) {
    console.error('Fetch error:', err)
    setError(err instanceof Error ? err.message : 'Failed to fetch')
  }
}, [])
```

### Issue 4: Form Submission Not Working
**Symptoms**: Form doesn't submit or shows validation errors

**Solutions**:
1. Verify Zod schema matches form fields
2. Check form field names match schema keys
3. Ensure resolver is set: `zodResolver(schema)`
4. Check for validation errors in UI
5. Verify async handler function is correct

```typescript
// ✅ Correct
const form = useForm<CreateProjectForm>({
  resolver: zodResolver(createProjectSchema),
  defaultValues: {
    name: '',
    status: 'active',
  },
})

// Field name must match schema
<FormField
  control={form.control}
  name="name"  // Must match schema
  render={({ field }) => (
    // ...
  )}
/>
```

### Issue 5: Dialog/Modal Not Showing
**Symptoms**: Button click doesn't open dialog

**Solutions**:
1. Verify provider wraps the component
2. Check `isOpen` state is being toggled
3. Verify `onOpenChange` is passed to Dialog
4. Check component hierarchy (provider > button + dialog)
5. Ensure hook is called correctly

```typescript
// ✅ Correct structure
function Feature() {
  return (
    <FeatureProvider>
      <Header>
        <Button onClick={() => useFeature().onOpenChange(true)} />
      </Header>
      <FeatureDialog />
    </FeatureProvider>
  )
}

// ✅ Correct hook usage
function FeatureDialog() {
  const { isOpen, onOpenChange } = useFeature()
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Dialog content */}
    </Dialog>
  )
}
```

### Issue 6: Tailwind Styles Not Applied
**Symptoms**: Components look unstyled

**Solutions**:
1. Check class names are spelled correctly
2. Verify Tailwind CSS file is imported in `styles/index.css`
3. Restart dev server
4. Check for conflicting styles
5. Use className prop, not class
6. Check CVA component configuration

```typescript
// ✅ Correct
className="flex items-center gap-4 rounded-lg bg-primary p-4"

// ❌ Wrong
className="flex items-center gap-4 rounded-lg bg-primary p-4 dark:bg-primary-dark"
// (dark: prefix handled automatically)
```

### Issue 7: Navigation Not Updating URL Params
**Symptoms**: URL doesn't change when navigating with search params

**Solutions**:
1. Check route navigation syntax
2. Verify search params are typed correctly
3. Use `useSearch()` hook properly
4. Ensure Router context is set up

```typescript
// ✅ Correct
const navigate = route.useNavigate()
const search = route.useSearch()

navigate({
  to: '/projects',
  search: { page: 2, status: 'active' }
})

// ✅ Access search params
const { page, status } = search
```

### Issue 8: Supabase Auth Errors
**Symptoms**: "Unauthorized", "Permission denied" errors

**Solutions**:
1. Check Supabase RLS (Row Level Security) policies
2. Verify user is logged in: `useAuth()`
3. Check user ID matches in policies
4. Verify table/column permissions
5. Check that auth.uid() policy is correct

```sql
-- ✅ Correct RLS policy for authenticated users
CREATE POLICY "Enable read access for authenticated users"
ON projects FOR SELECT
USING (auth.role() = 'authenticated_user')

-- ✅ Policy for user's own data
CREATE POLICY "Enable read access to own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id)
```

### Issue 9: Performance Issues
**Symptoms**: App is slow, laggy, or freezes

**Solutions**:
1. Check React Query cache settings
2. Use `useCallback` for functions passed as props
3. Avoid inline object/array creation in renders
4. Check for unnecessary re-renders (React DevTools)
5. Implement virtualization for large lists
6. Check bundle size

```typescript
// ✅ Good: Memoized function
const handleSubmit = useCallback(async (data) => {
  await submitForm(data)
}, [])

// ❌ Bad: Recreated on every render
const handleSubmit = async (data) => {
  await submitForm(data)
}
```

### Issue 10: TypeScript Errors on Build
**Symptoms**: Build fails with TypeScript errors

**Solutions**:
1. Run type check: `pnpm tsc`
2. Fix all reported type errors
3. Check for missing type imports
4. Verify generic types are complete
5. Use `satisfies` operator for better inference

```typescript
// ✅ Complete type
interface Props {
  items: Array<{ id: string; name: string }>
}

// ✅ Using satisfies for inference
const config = {
  // ...
} satisfies Config

// ❌ Incomplete - missing type
const items = []
```

---

## Debugging Guide

### Step 1: Enable DevTools
In development, the app includes useful debugging tools:
- **React Query DevTools** (bottom left): Check cached queries
- **TanStack Router DevTools** (bottom right): Check routes and navigation

### Step 2: Console Logging
```typescript
// Check what data is being fetched
console.log('Fetched data:', data)

// Check state changes
console.log('Form values:', form.getValues())

// Check navigation
console.log('Current route:', useRouter().state.location.pathname)
```

### Step 3: Browser DevTools
1. **Network Tab**: Check API requests and responses
2. **Application Tab**: Check localStorage, cookies
3. **Console Tab**: Look for errors and warnings
4. **React DevTools**: Check component tree and props

### Step 4: Check Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Check table data in "Table Editor"
3. Check RLS policies in "Authentication > Policies"
4. Check logs in "Database > Query Performance"

---

## Quick Reference: File Locations

```
Creating a new feature? Use this template:

features/[feature-name]/
├── components/
│   ├── [feature]-columns.tsx      # Table columns definition
│   ├── [feature]-table.tsx        # Main table component
│   ├── [feature]-action-dialog.tsx # Create/edit dialog
│   ├── [feature]-delete-dialog.tsx # Delete confirmation
│   ├── [feature]-dialogs.tsx      # Dialog manager
│   ├── [feature]-primary-buttons.tsx # Action buttons
│   ├── data-table-row-actions.tsx # Row action dropdown
│   └── [feature]-provider.tsx     # Context provider
│
├── hooks/
│   ├── use-[feature].ts           # Main data hook
│   └── index.ts                   # Export hook
│
├── data/
│   └── schema.ts                  # Zod schemas & types
│
└── index.tsx                      # Main feature export

routes/_authenticated/
└── [feature]/
    └── index.tsx                  # Route definition
```

---

## Environment Variables

Create `.env.local` in project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional - API endpoints
VITE_API_URL=http://localhost:3000/api
```

Get these from your Supabase project settings.

---

## Build & Deploy Checklist

- [ ] Run `pnpm lint` - fix all linting errors
- [ ] Run `pnpm format` - format code
- [ ] Run `pnpm tsc` - check TypeScript
- [ ] Run `pnpm build` - verify build succeeds
- [ ] Test app in `pnpm preview`
- [ ] Check for console errors/warnings
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Update documentation
- [ ] Update changelog
- [ ] Create git commit with descriptive message
- [ ] Push to repository
- [ ] Deploy to production

---

## Performance Optimization Tips

### 1. Code Splitting
```typescript
// Lazy load routes
const Projects = lazy(() => import('@/features/projects'))
```

### 2. Query Caching
```typescript
// React Query handles this automatically
// Default stale time is 10 seconds
```

### 3. Image Optimization
```typescript
// Use Tailwind's built-in image optimization
<img 
  src="/image.jpg" 
  alt="Description"
  className="object-cover"
  loading="lazy"
/>
```

### 4. Bundle Analysis
```bash
# Check bundle size
pnpm run build

# Analyze in detail
npm install -g webpack-bundle-analyzer
```

---

## Accessibility Checklist

- [ ] All form inputs have labels
- [ ] All images have alt text
- [ ] Color not only means of conveying info
- [ ] Sufficient contrast ratio (WCAG AA)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] ARIA labels on interactive elements
- [ ] Page structure with proper headings
- [ ] Links have descriptive text
- [ ] Tested with screen reader

```typescript
// ✅ Good accessibility
<button 
  aria-label="Delete project"
  onClick={handleDelete}
  className="focus:outline-none focus:ring-2 focus:ring-offset-2"
>
  <Trash2 size={16} />
</button>

// ❌ Poor accessibility
<button onClick={handleDelete}>
  <Trash2 size={16} />
</button>
```

---

## Security Best Practices

- [ ] Never commit `.env.local` files
- [ ] Never hardcode API keys or secrets
- [ ] Always use HTTPS in production
- [ ] Validate all user inputs
- [ ] Sanitize user-generated content
- [ ] Implement proper Supabase RLS policies
- [ ] Keep dependencies updated
- [ ] Run security audits: `npm audit`
- [ ] Enable CORS properly in Supabase
- [ ] Use environment variables for sensitive data

```typescript
// ✅ Correct: Environment variable
const apiKey = import.meta.env.VITE_API_KEY

// ❌ Wrong: Hardcoded secret
const apiKey = 'sk_live_abc123'
```

---

## Need More Help?

### Resources
- 📚 [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Comprehensive feature guide
- 🗂️ [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) - System architecture
- 💾 [DATABASE.md](./DATABASE.md) - Database schema
- 🎨 [UI_MOCKUPS.md](./UI_MOCKUPS.md) - UI designs

### External Resources
- [Shadcn UI Docs](https://ui.shadcn.com)
- [TanStack Router](https://tanstack.com/router/latest)
- [React Query](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### Getting Support
1. Check existing documentation
2. Search GitHub issues
3. Check browser console for errors
4. Enable DevTools and debug
5. Check network tab for API issues
6. Review Supabase logs

---

**Last Updated**: 2024
**Project**: Rapibuol Admin Dashboard