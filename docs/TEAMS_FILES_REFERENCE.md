# Teams Feature - Files Reference Guide

## 📁 Complete File Structure

### Feature Directory: `src/features/teams/`

```
src/features/teams/
├── api/
│   └── teams.ts                    # Legacy API functions (kept for reference)
│
├── components/
│   ├── data-table-row-actions.tsx  # Row action dropdown menu (Edit/Delete)
│   ├── teams-action-dialog.tsx     # Create/Edit team dialog component
│   ├── teams-columns.tsx           # TanStack Table column definitions
│   ├── teams-delete-dialog.tsx     # Delete confirmation alert dialog
│   ├── teams-dialogs.tsx           # Dialog manager (renders all dialogs)
│   ├── teams-members-dialog.tsx    # Team members management dialog
│   ├── teams-primary-buttons.tsx   # Add Team button component
│   ├── teams-provider.tsx          # React Context provider for state
│   └── teams-table.tsx             # Data table with pagination/sorting
│
├── data/
│   └── schema.ts                   # Zod schemas & TypeScript types (8 schemas)
│
├── hooks/
│   ├── index.ts                    # Export all hooks
│   └── use-teams.ts                # useTeams & useTeamMembers hooks
│
└── index.tsx                        # Main Teams feature component
```

### Routes Directory: `src/routes/_authenticated/teams/`

```
src/routes/_authenticated/teams/
└── index.tsx                        # Route definition for /teams path
```

### Updated Files

```
src/components/layout/data/
└── sidebar-data.ts                 # UPDATED: Added Teams menu item
```

---

## 📋 File Descriptions & Purpose

### Data Layer

#### `src/features/teams/data/schema.ts`
**Purpose**: Define all Zod schemas and TypeScript types
**Lines**: 99
**Contains**:
- `teamSchema` - Database schema for teams
- `teamWithLeaderSchema` - Teams with leader details
- `teamMemberSchema` - Team member database schema
- `teamMemberWithUserSchema` - Team members with user details
- `createTeamSchema` - Form validation for creating teams
- `updateTeamSchema` - Form validation for updating teams
- `addTeamMemberSchema` - Form validation for adding members
- `updateTeamMemberSchema` - Form validation for updating member roles

**Key Features**:
- All schemas include validation rules
- Team name: min 2, max 100 chars
- Description: optional, max 500 chars
- Full UUID format validation
- Enum validation for roles

---

### Hooks Layer

#### `src/features/teams/hooks/use-teams.ts`
**Purpose**: CRUD operations and data fetching logic
**Lines**: 365
**Exports**:
- `useTeams()` - Manage teams collection
- `useTeamMembers(teamId)` - Manage team members

**useTeams() Methods**:
- `fetchTeams()` - Fetch all teams with leader details and member counts
- `createTeam(formData)` - Create new team with validation
- `updateTeam(id, formData)` - Update team information
- `deleteTeam(id)` - Delete single team (cascade deletes members)
- `deleteTeams(ids)` - Bulk delete multiple teams
- Returns: `{ teams, isLoading, error, refetch }`

**useTeamMembers() Methods**:
- `fetchMembers()` - Fetch team members with user details
- `addMember(formData)` - Add user to team (duplicate prevention)
- `updateMemberRole(memberId, role)` - Change member role
- `removeMember(memberId)` - Remove member from team
- `removeMembers(memberIds)` - Bulk remove members
- Returns: `{ members, isLoading, error, refetch }`

**Features**:
- Full error handling with try-catch
- Console logging for debugging
- Automatic data refresh after operations
- Duplicate member prevention

#### `src/features/teams/hooks/index.ts`
**Purpose**: Export all hooks for easy importing
**Lines**: 1
**Exports**: `useTeams`, `useTeamMembers`

---

### Components Layer

#### `src/features/teams/components/teams-provider.tsx`
**Purpose**: React Context for managing dialog states
**Lines**: 54
**Provides**:
- Create dialog state (`isCreateOpen`, `onCreateOpen`)
- Edit dialog state (`isEditOpen`, `onEditDialogOpen`)
- Delete dialog state (`isDeleteOpen`, `onDeleteDialogOpen`)
- Members dialog state (`isMembersOpen`, `onMembersOpen`)
- Selected team reference (`selectedTeam`, `setSelectedTeam`)

**Hook**: `useTeamDialog()` - Access context anywhere

---

#### `src/features/teams/components/teams-columns.tsx`
**Purpose**: Define table columns for TanStack Table
**Lines**: 71
**Columns**:
1. Team name (with icon)
2. Team leader (name and email)
3. Description (truncated)
4. Member count (badge)
5. Created date
6. Actions (dropdown)

**Features**:
- Custom cell renderers
- Icon and badge styling
- Responsive text truncation

---

#### `src/features/teams/components/data-table-row-actions.tsx`
**Purpose**: Dropdown menu for each team row
**Lines**: 52
**Actions**:
- Edit Team - Opens edit dialog
- Delete Team - Opens delete confirmation
- Styled with lucide-react icons

**Interaction**:
- Uses `useTeamDialog` hook to manage state
- Passes row data to dialogs

---

#### `src/features/teams/components/teams-action-dialog.tsx`
**Purpose**: Create and edit teams dialog
**Lines**: 220
**Modes**:
- Create mode: Empty form
- Edit mode: Pre-filled form with existing data

**Form Fields**:
- Team name (required, with validation)
- Description (optional, textarea)
- Team leader (optional, select dropdown)

**Features**:
- React Hook Form integration
- Zod validation
- Loading states during submission
- Automatic form population in edit mode
- Cancel and submit buttons

---

#### `src/features/teams/components/teams-delete-dialog.tsx`
**Purpose**: Confirm team deletion
**Lines**: 62
**Content**:
- Shows team name being deleted
- Warning about cascading member deletion
- Cancel and Delete buttons
- Loading state during deletion

**Integration**:
- Uses `useTeamDialog` for state
- Uses `useTeams` for deleteTeam operation
- Toast notifications for feedback

---

#### `src/features/teams/components/teams-members-dialog.tsx`
**Purpose**: Comprehensive team members management
**Lines**: 303
**Sections**:
1. Add Member form
   - User selection dropdown (filters existing members)
   - Role selection (member/manager/admin)
   - Add/Cancel buttons

2. Members table
   - Name and email columns
   - Role with color-coded badge
   - Join date
   - Remove button (trash icon)

3. Empty/Loading states
   - "Loading members..." during fetch
   - "No members in this team yet" when empty
   - "All users are already members" in add form

**Features**:
- Duplicate member prevention
- Available users filtering
- Role-based badge styling
- Inline member removal

---

#### `src/features/teams/components/teams-primary-buttons.tsx`
**Purpose**: Action buttons (currently "Add Team")
**Lines**: 16
**Contains**:
- "Add Team" button with Plus icon
- Opens create team dialog
- Uses `useTeamDialog` hook

**Future**: Can add more buttons here

---

#### `src/features/teams/components/teams-table.tsx`
**Purpose**: Data table with all table features
**Lines**: 176
**Features**:
- Sorting on all columns
- Pagination (10 items per page)
- Row filtering
- Column visibility toggling
- Row selection with checkboxes
- Loading states
- Empty state message

**Components**:
- DataTableToolbar for search/filter
- Table with header and body
- DataTablePagination controls

**Integration**:
- Uses `teamsColumns` for definitions
- Uses `useTableUrlState` for URL state
- TanStack Table for rendering

---

#### `src/features/teams/components/teams-dialogs.tsx`
**Purpose**: Dialog manager component
**Lines**: 13
**Renders**:
- TeamsActionDialog (create/edit)
- TeamsDeleteDialog (delete confirmation)
- TeamsMembersDialog (manage members)

**Purpose**: Clean separation of concerns

---

#### `src/features/teams/index.tsx`
**Purpose**: Main Teams feature component
**Lines**: 60
**Layout**:
- Header with search, theme switch, config, profile
- Main content area with:
  - Title and description
  - Add Team button
  - Teams table
  - Error handling
- TeamsDialogs manager
- Wrapped with TeamsProvider

**Features**:
- Responsive design
- Error display with dark mode support
- Full feature integration

---

### API Layer (Legacy)

#### `src/features/teams/api/teams.ts`
**Purpose**: Standalone API functions (kept for reference)
**Lines**: ~50
**Exports**:
- `getTeams()`
- `createTeam(team)`
- `updateTeam(id, team)`
- `deleteTeam(id)`

**Note**: Currently using hooks instead, kept for reference

---

### Routing

#### `src/routes/_authenticated/teams/index.tsx`
**Purpose**: Route definition for teams page
**Lines**: 6
**Content**:
```typescript
export const Route = createFileRoute('/_authenticated/teams/')({
  component: Teams,
})
```
**Result**: Makes `/teams` route available

---

### Navigation

#### `src/components/layout/data/sidebar-data.ts`
**Purpose**: Sidebar menu configuration
**Changes**:
- Added import: `Users2` icon
- Added menu item:
  ```typescript
  {
    title: 'Teams',
    url: '/teams',
    icon: Users2,
  }
  ```
**Result**: "Teams" appears in sidebar General section

---

## 🔗 File Dependencies

### Import Graph
```
index.tsx (Teams main component)
├── components/teams-table.tsx
│   ├── data/schema.ts (TeamWithLeader type)
│   └── components/teams-columns.tsx
│       └── components/data-table-row-actions.tsx
│           └── components/teams-provider.tsx
│
├── components/teams-primary-buttons.tsx
│   └── components/teams-provider.tsx
│
├── components/teams-dialogs.tsx
│   ├── components/teams-action-dialog.tsx
│   │   ├── hooks/use-teams.ts
│   │   ├── data/schema.ts
│   │   └── components/teams-provider.tsx
│   │
│   ├── components/teams-delete-dialog.tsx
│   │   ├── hooks/use-teams.ts
│   │   └── components/teams-provider.tsx
│   │
│   └── components/teams-members-dialog.tsx
│       ├── hooks/use-teams.ts
│       ├── data/schema.ts
│       └── components/teams-provider.tsx
│
└── components/teams-provider.tsx
    └── data/schema.ts
```

---

## 📊 Statistics

| Category | Count |
|----------|-------|
| Total Files Created | 15 |
| Component Files | 9 |
| Hook Files | 2 |
| Schema Files | 1 |
| Route Files | 1 |
| API Files | 1 |
| Updated Files | 1 |
| **Total Lines of Code** | **~1,500+** |

---

## 🎯 File Organization by Function

### UI Components (User Interaction)
- `teams-primary-buttons.tsx` - Action buttons
- `teams-action-dialog.tsx` - Create/Edit form
- `teams-delete-dialog.tsx` - Delete confirmation
- `teams-members-dialog.tsx` - Members management
- `data-table-row-actions.tsx` - Row menu

### Data Components (Display)
- `teams-table.tsx` - Main table display
- `teams-columns.tsx` - Column definitions

### State Management
- `teams-provider.tsx` - Context provider
- `teams-dialogs.tsx` - Dialog orchestration

### Business Logic
- `use-teams.ts` - CRUD operations
- `schema.ts` - Data validation

### Integration
- `index.tsx` - Feature assembly
- Route file - URL mapping
- Sidebar data - Navigation

---

## 🔄 Data Flow Through Files

```
User Action (Click button)
    ↓
teams-primary-buttons.tsx or data-table-row-actions.tsx
    ↓
teams-provider.tsx (Update context state)
    ↓
Dialog Component Opens:
- teams-action-dialog.tsx
- teams-delete-dialog.tsx
- teams-members-dialog.tsx
    ↓
Form/Confirmation (User input)
    ↓
schema.ts (Zod validation)
    ↓
use-teams.ts Hook (Business logic)
    ↓
Supabase API Call
    ↓
Database Update
    ↓
Refresh Data (useTeams/useTeamMembers)
    ↓
teams-table.tsx (Display updated data)
    ↓
Toast Notification
```

---

## 💡 How to Extend

### Add a New Feature
1. Add new schema in `data/schema.ts`
2. Add new method in `hooks/use-teams.ts`
3. Create new dialog component in `components/`
4. Import in `components/teams-dialogs.tsx`
5. Add provider state if needed

### Modify Table Display
- Edit `components/teams-columns.tsx` for structure
- Or modify `components/teams-table.tsx` for behavior

### Add New Dialog
1. Create `components/teams-{feature}-dialog.tsx`
2. Add state to `components/teams-provider.tsx`
3. Import in `components/teams-dialogs.tsx`
4. Render in main component

---

## ✅ File Checklist

Essential Files (All Present)
- [x] `data/schema.ts` - Data validation
- [x] `hooks/use-teams.ts` - Business logic
- [x] `components/teams-provider.tsx` - State management
- [x] `components/teams-table.tsx` - Main table
- [x] `components/teams-action-dialog.tsx` - Create/Edit
- [x] `components/teams-delete-dialog.tsx` - Delete
- [x] `components/teams-members-dialog.tsx` - Members
- [x] `index.tsx` - Feature assembly
- [x] Route file - URL mapping
- [x] Sidebar integration - Navigation

---

**Last Updated**: 2024
**Teams Feature Version**: 1.0
**Status**: ✅ Complete