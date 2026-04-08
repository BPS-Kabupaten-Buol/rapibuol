# RAPIBUOL - Frontend Implementation Plan
## Sistem Pelaporan Aktivitas Harian dengan Visualisasi GitHub Contribution Graph

---

## Executive Summary

Dokumen ini menyajikan comprehensive implementation plan untuk frontend development sistem pelaporan aktivitas harian (Activity Reporting System) dengan visualisasi berbasis GitHub Contribution Graph. Plan ini mencakup architecture, UI/UX design, navigation structure, component hierarchy, dan development roadmap.

---

## Table of Contents

1. [Technical Stack](#technical-stack)
2. [Architecture Overview](#architecture-overview)
3. [Design System](#design-system)
4. [Page Structure & Navigation](#page-structure--navigation)
5. [Component Hierarchy](#component-hierarchy)
6. [State Management Strategy](#state-management-strategy)
7. [UI/UX Flows](#uiux-flows)
8. [Development Phases](#development-phases)
9. [Performance & Optimization](#performance--optimization)
10. [Accessibility & Best Practices](#accessibility--best-practices)

---

## 1. Technical Stack

### Frontend Framework
- **Framework:** React 18+ dengan TypeScript
- **Build Tool:** Vite (untuk development speed)
- **Styling:** Tailwind CSS + CSS Modules (untuk component-scoped styles)
- **UI Component Library:** shadcn/ui (Headless components dengan Radix UI)
- **Icons:** Lucide React

### Visualization & Charts
- **Calendar Heatmap:** react-calendar-heatmap atau custom implementation dengan Canvas
- **Charts & Analytics:** Recharts atau Nivo (untuk statistik tim & kepala satker)
- **Date Handling:** dayjs atau date-fns

### State Management & Data Fetching
- **State Management:** TanStack Query (React Query) untuk server state
- **Global State:** Zustand atau Context API + useReducer untuk client state
- **Form Management:** React Hook Form + Zod untuk validation

### Routing & Navigation
- **Router:** React Router v6+
- **Navigation State:** URL-based state management

### Development Tools
- **Code Quality:** ESLint + Prettier
- **Testing:** Vitest + React Testing Library
- **API Client:** Axios atau Fetch API dengan custom hooks

### Package Manager
- npm atau pnpm (recommended untuk monorepo di masa depan)

---

## 2. Architecture Overview

### 2.1 Folder Structure

```
rapibuol/
├── public/
│   ├── assets/
│   │   ├── logos/
│   │   ├── illustrations/
│   │   └── icons/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── common/              # Shared components
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   ├── Navbar/
│   │   │   ├── Footer/
│   │   │   └── Layout/
│   │   ├── dashboard/           # Dashboard-specific components
│   │   │   ├── ActivityHeatmap/
│   │   │   ├── ProgressTracker/
│   │   │   ├── StatCard/
│   │   │   └── QuickStats/
│   │   ├── logs/                # Activity log components
│   │   │   ├── LogEntry/
│   │   │   ├── LogForm/
│   │   │   ├── LogList/
│   │   │   └── LogDetail/
│   │   ├── monitoring/          # Monitoring & reporting components
│   │   │   ├── TeamOverview/
│   │   │   ├── MemberGrid/
│   │   │   ├── ReportGenerator/
│   │   │   └── FilterBar/
│   │   ├── admin/               # Admin management components
│   │   │   ├── UserManagement/
│   │   │   ├── TeamManagement/
│   │   │   ├── RoleAssignment/
│   │   │   └── AdminPanel/
│   │   └── auth/                # Authentication components
│   │       ├── LoginForm/
│   │       ├── RegisterForm/
│   │       └── ProtectedRoute/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── dashboard/
│   │   │   ├── EmployeeDashboard.tsx
│   │   │   ├── TeamLeaderDashboard.tsx
│   │   │   ├── DepartmentHeadDashboard.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── logs/
│   │   │   ├── LogsPage.tsx
│   │   │   ├── LogDetailPage.tsx
│   │   │   └── CreateLogPage.tsx
│   │   ├── monitoring/
│   │   │   ├── TeamMonitoring.tsx
│   │   │   ├── ReportPage.tsx
│   │   │   └── ExportPage.tsx
│   │   ├── management/
│   │   │   ├── UsersPage.tsx
│   │   │   ├── TeamsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── NotFound.tsx
│   │   └── ErrorBoundary.tsx
│   ├── hooks/
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useLogs.ts           # Logs CRUD operations
│   │   ├── useTeams.ts          # Team data operations
│   │   ├── useUsers.ts          # User management operations
│   │   ├── useFilters.ts        # Filter state management
│   │   ├── useExport.ts         # Export functionality
│   │   └── useNotification.ts   # Toast/notification handler
│   ├── services/
│   │   ├── api.ts               # API client configuration
│   │   ├── authService.ts       # Authentication endpoints
│   │   ├── logsService.ts       # Logs endpoints
│   │   ├── teamsService.ts      # Teams endpoints
│   │   ├── usersService.ts      # Users endpoints
│   │   ├── reportsService.ts    # Reports endpoints
│   │   └── exportService.ts     # Export (PDF, Excel) logic
│   ├── stores/
│   │   ├── authStore.ts         # Zustand auth store
│   │   ├── filterStore.ts       # Global filter state
│   │   ├── notificationStore.ts # Toast notifications
│   │   └── uiStore.ts           # UI state (sidebar toggle, theme, etc.)
│   ├── types/
│   │   ├── index.ts             # Main types export
│   │   ├── user.ts              # User-related types
│   │   ├── team.ts              # Team-related types
│   │   ├── log.ts               # Log-related types
│   │   ├── filters.ts           # Filter types
│   │   └── api.ts               # API response types
│   ├── utils/
│   │   ├── constants.ts         # App constants & enums
│   │   ├── formatters.ts        # Date, number, text formatters
│   │   ├── validators.ts        # Form validators
│   │   ├── dateHelpers.ts       # Date manipulation utilities
│   │   ├── heatmapHelpers.ts    # Heatmap data generation
│   │   └── localStorage.ts      # LocalStorage manager
│   ├── styles/
│   │   ├── globals.css          # Global styles
│   │   ├── tailwind.config.ts   # Tailwind configuration
│   │   └── variables.css        # CSS variables (colors, spacing, etc.)
│   ├── config/
│   │   ├── routes.ts            # Route definitions
│   │   ├── roles.ts             # Role configurations
│   │   └── features.ts          # Feature flags
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── vite-env.d.ts
├── tests/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── utils/
├── .env.example
├── .env.local
├── .gitignore
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### 2.2 Component Architecture Pattern

```
Layout Pattern (Common across pages):
┌─────────────────────────────────────┐
│         Header / Navbar              │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │    Main Content Area     │
│          │                          │
│          │  ┌──────────────────┐   │
│          │  │  Page Content    │   │
│          │  │  (Role-based)    │   │
│          │  └──────────────────┘   │
├──────────┴──────────────────────────┤
│         Footer (optional)            │
└─────────────────────────────────────┘
```

### 2.3 Data Flow Architecture

```
User Action
    ↓
Component Event Handler
    ↓
useHook (React Hook Form, useLogs, etc.)
    ↓
API Service Call (Axios)
    ↓
TanStack Query (React Query) Cache
    ↓
Zustand Store (Global State)
    ↓
Component Re-render
```

---

## 3. Design System

### 3.1 Color Palette

```
Primary Colors:
- Primary: #2563EB (Blue)
- Secondary: #64748B (Slate)

Status Colors (Activity Heatmap):
- Level 0 (No activity): #EEEEEE
- Level 1 (Light): #C6E48B
- Level 2 (Medium): #7BC67B
- Level 3 (High): #239A3B
- Level 4 (Very High): #196127

Status Indicators:
- Success: #16A34A (Green)
- Warning: #EAB308 (Yellow)
- Danger: #DC2626 (Red)
- Info: #0EA5E9 (Cyan)

Grayscale:
- Background: #F8FAFC
- Surface: #FFFFFF
- Border: #E2E8F0
- Text Primary: #1E293B
- Text Secondary: #64748B
- Text Disabled: #94A3B8
```

### 3.2 Typography System

```
Font Family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

Heading Scales:
- H1: 32px, 600 weight, line-height 1.2
- H2: 24px, 600 weight, line-height 1.3
- H3: 20px, 600 weight, line-height 1.4
- H4: 18px, 600 weight, line-height 1.5

Body Text:
- Large: 16px, 400 weight, line-height 1.5
- Regular: 14px, 400 weight, line-height 1.6
- Small: 12px, 400 weight, line-height 1.5

Caption:
- 12px, 400 weight, line-height 1.4, color: text-secondary
```

### 3.3 Spacing System

```
Base Unit: 4px

Scales:
- xs: 4px    (0.25rem)
- sm: 8px    (0.5rem)
- md: 12px   (0.75rem)
- lg: 16px   (1rem)
- xl: 20px   (1.25rem)
- 2xl: 24px  (1.5rem)
- 3xl: 32px  (2rem)
- 4xl: 40px  (2.5rem)
- 5xl: 48px  (3rem)
```

### 3.4 Component Library (shadcn/ui)

Core Components to Implement:
- Button (Primary, Secondary, Ghost, Outline variants)
- Card
- Input
- Select / Combobox
- Checkbox / Radio
- Switch
- Dialog / Modal
- Tabs
- Alert
- Badge
- Toast / Sonner
- Table
- Dropdown Menu
- Popover
- Tooltip
- Skeleton / Loading states
- Avatar
- Progress Bar
- Calendar Picker (custom for heatmap integration)

---

## 4. Page Structure & Navigation

### 4.1 Navigation Map

```
Root (/)
├── Auth Routes
│   ├── /login                    [Public]
│   ├── /register                 [Public]
│   └── /forgot-password          [Public]
│
├── Dashboard Routes (Protected)
│   ├── /dashboard                [All Roles - redirects to role-specific]
│   ├── /dashboard/employee       [Employee, Team Leader, Dept Head, Admin]
│   ├── /dashboard/team-leader    [Team Leader, Dept Head, Admin]
│   ├── /dashboard/department-head [Dept Head, Admin]
│   └── /dashboard/admin          [Admin only]
│
├── Activity Logs Routes
│   ├── /logs                     [All authenticated]
│   ├── /logs/new                 [All authenticated]
│   ├── /logs/:id                 [All authenticated]
│   ├── /logs/:id/edit            [Own logs only / Team Leader+]
│   └── /logs/export              [Team Leader, Dept Head, Admin]
│
├── Monitoring Routes (Team Leader+)
│   ├── /monitoring/team          [Team Leader, Dept Head, Admin]
│   ├── /monitoring/team/:teamId  [Team Leader of that team, Dept Head, Admin]
│   ├── /monitoring/members/:memberId [Team Leader+]
│   └── /monitoring/reports       [Team Leader, Dept Head, Admin]
│
├── Management Routes (Admin)
│   ├── /management/users         [Admin only]
│   ├── /management/users/:id     [Admin only]
│   ├── /management/teams         [Admin only]
│   ├── /management/teams/:id     [Admin only]
│   └── /management/settings      [Admin only]
│
└── Utility Routes
    ├── /404
    ├── /500
    └── /unauthorized
```

### 4.2 Navigation Structure

#### Main Navigation (All Users)
```
Header:
├── Logo / App Title (clickable → /dashboard)
├── Search / Quick Actions
├── User Profile Menu
│   ├── View Profile
│   ├── Settings
│   └── Logout
└── Theme Toggle (optional)

Sidebar (Collapsible on mobile):
├── Dashboard (icon + text)
├── Logs
│   ├── My Logs
│   ├── New Log
│   └── View History
├── Team Monitoring (conditional - TL+)
│   ├── Team Overview
│   └── Member Details
├── Reports (conditional - TL+)
├── Management (conditional - Admin)
│   ├── Users
│   ├── Teams
│   └── Settings
└── Help & Support
```

#### Breadcrumb Navigation
```
Dashboard / Logs / View Details
Dashboard / Team / Member / Activity History
Dashboard / Reports / Monthly Export
Management / Teams / Engineering / Edit
```

### 4.3 Mobile Navigation Strategy

```
Mobile Menu (Hamburger):
├── Collapse/Expand Sidebar
├── Quick Actions Menu
├── Bottom Navigation Bar (sticky):
   ├── Dashboard Icon
   ├── Logs Icon
   ├── Team Icon (if applicable)
   ├── Reports Icon (if applicable)
   └── Menu Icon (more options)
```

---

## 5. Component Hierarchy

### 5.1 Common Layout Components

```
<Layout>
  ├── <Header>
  │   ├── <Logo>
  │   ├── <SearchBar>
  │   └── <UserMenu>
  ├── <Sidebar>
  │   ├── <NavItem> × n
  │   └── <NavGroup> × n
  ├── <MainContent>
  │   ├── <Breadcrumb>
  │   └── {children}
  └── <Toast/Notification Container>
```

### 5.2 Dashboard Components

#### Employee Dashboard
```
<EmployeeDashboard>
  ├── <PageHeader title="Dashboard" />
  ├── <QuickStats>
  │   ├── <StatCard label="Today" value="3 logs" />
  │   ├── <StatCard label="This Week" value="15 logs" />
  │   └── <StatCard label="This Month" value="62 logs" />
  ├── <ActivityHeatmap 
  │     data={heatmapData}
  │     year={2024}
  │     onDateClick={handleLogEntry}
  │   />
  ├── <ProgressBar 
  │     label="Monthly Target"
  │     current={24}
  │     target={20}
  │     percentage={120}
  │   />
  ├── <RecentLogs limit={5} />
  └── <CTA button="Add New Log" />
```

#### Team Leader Dashboard
```
<TeamLeaderDashboard>
  ├── <PageHeader title="Team Dashboard" />
  ├── <QuickStats>
  │   ├── <StatCard label="Team Logs Today" value="8/10" />
  │   ├── <StatCard label="Missing Reports" value="2" badge="warning" />
  │   └── <StatCard label="Team Completion" value="94%" />
  ├── <TeamMemberStatus>
  │   ├── <MemberCard 
  │   │     name="Employee 1"
  │   │     status="completed"
  │   │     timestamp="2 hours ago"
  │   │   />
  │   ├── <MemberCard status="pending" />
  │   └── <MemberCard status="overdue" />
  ├── <TeamActivityTrend chart={trendData} />
  ├── <FilterBar dateRange, member filter />
  └── <ExportButton />
```

#### Department Head Dashboard
```
<DepartmentHeadDashboard>
  ├── <PageHeader title="Department Overview" />
  ├── <DepartmentStats>
  │   ├── <StatCard label="Total Employees" value="45" />
  │   ├── <StatCard label="Active Today" value="42" />
  │   └── <StatCard label="Department Target" value="89%" badge="success" />
  ├── <TeamPerformanceGrid>
  │   ├── <TeamCard 
  │   │     teamName="Engineering"
  │   │     completion="95%"
  │   │     memberCount="12"
  │   │     click={navigate to team details}
  │   │   />
  │   └── <TeamCard> × n
  ├── <DepartmentTrend period="monthly" />
  ├── <DistributionChart workloadAnalysis />
  └── <AlertBox overdueReports={count} />
```

### 5.3 Log Management Components

```
<CreateLogPage>
  ├── <PageHeader title="Add New Log" />
  ├── <LogForm>
  │   ├── <DateSelector defaultDate="today" />
  │   ├── <TextArea 
  │   │     label="Activity Description"
  │   │     placeholder="Describe your activity..."
  │   │     maxLength={1000}
  │   │   />
  │   ├── <FileUpload 
  │   │     label="Proof/Attachment"
  │   │     accept="link, file"
  │   │   />
  │   ├── <TagSelector tags={projects, departments} />
  │   └── <ButtonGroup>
  │       ├── <Button type="submit" label="Save" />
  │       └── <Button type="cancel" label="Cancel" />
  └── <SuccessMessage />
```

```
<LogsPage>
  ├── <PageHeader title="My Logs" />
  ├── <FilterBar>
  │   ├── <DateRangePicker />
  │   ├── <SearchInput />
  │   └── <ViewToggle grid/list />
  ├── <LogsList>
  │   ├── <LogItem 
  │   │     date="Dec 15, 2024"
  │   │     title="Task XYZ completed"
  │   │     preview="..."
  │   │     onClick={view details}
  │   │   />
  │   └── <LogItem> × n
  └── <Pagination />
```

```
<LogDetailPage>
  ├── <PageHeader 
  │     title="Log Details"
  │     backButton={true}
  │   />
  ├── <LogHeader>
  │   ├── Date & Time
  │   ├── Status Badge
  │   └── Action Menu (Edit, Delete, Share)
  ├── <LogContent>
  │   ├── <ActivityDescription />
  │   ├── <ProofSection>
  │   │   ├── <LinkPreview /> or <FilePreview />
  │   │   └── <DownloadButton />
  │   └── <MetaData 
  │       createdBy, lastModified, verificationStatus
  │     />
  └── <CommentSection /> (optional)
```

### 5.4 Monitoring & Reporting Components

```
<TeamMonitoringPage>
  ├── <PageHeader title="Team Monitoring" />
  ├── <TeamSelector dropdown />
  ├── <StatusOverview>
  │   ├── <StatusBadge count="8" status="completed" />
  │   ├── <StatusBadge count="2" status="pending" />
  │   └── <StatusBadge count="0" status="overdue" />
  ├── <MemberGrid>
  │   ├── <MemberCard 
  │   │     avatar={url}
  │   │     name="Employee Name"
  │   │     status="completed"
  │   │     lastLogTime="10:30 AM"
  │   │     logsCount="15"
  │   │     onClick={view details}
  │   │   />
  │   └── <MemberCard> × n
  ├── <ActivityTimeline week view />
  └── <QuickActions>
      ├── <Button label="Send Reminder" />
      └── <Button label="View Report" />
```

```
<ReportPage>
  ├── <PageHeader title="Reports & Export" />
  ├── <FilterPanel>
  │   ├── <DateRangePicker />
  │   ├── <PeriodSelector daily/weekly/monthly />
  │   ├── <TeamMultiSelect />
  │   └── <MemberMultiSelect />
  ├── <PreviewSection>
  │   ├── <ReportPreview>
  │   │   ├── Summary Statistics
  │   │   ├── Activity Breakdown
  │   │   └── Trend Analysis
  │   └── <ExportOptions>
  │       ├── <Button label="Export PDF" />
  │       └── <Button label="Export Excel" />
  └── <ScheduledReportSetup /> (optional)
```

### 5.5 Management Components (Admin Only)

```
<UserManagementPage>
  ├── <PageHeader title="User Management" />
  ├── <ToolBar>
  │   ├── <SearchInput />
  │   ├── <FilterDropdown role, team, status />
  │   └── <Button label="Add User" />
  ├── <UserTable>
  │   ├── <TableHeader 
  │   │     columns={name, email, role, team, status, actions}
  │   │   />
  │   ├── <TableRow 
  │   │     onClick={edit}
  │   │     actions={edit, disable, delete}
  │   │   />
  │   └── <TableRow> × n
  └── <Pagination />

<UserDetailModal>
  ├── <TextField label="Name" />
  ├── <TextField label="Email" />
  ├── <RoleSelect options={roles} />
  ├── <TeamSelect options={teams} />
  ├── <StatusToggle />
  └── <ButtonGroup save/cancel />
```

```
<TeamManagementPage>
  ├── <PageHeader title="Team Management" />
  ├── <ToolBar>
  │   ├── <SearchInput />
  │   └── <Button label="Create Team" />
  ├── <TeamGrid>
  │   ├── <TeamCard 
  │   │     name="Engineering"
  │   │     leader="John Doe"
  │   │     memberCount={12}
  │   │     actions={edit, delete}
  │   │   />
  │   └── <TeamCard> × n
  └── <Pagination />

<TeamDetailModal>
  ├── <TextField label="Team Name" />
  ├── <UserSelect label="Team Leader" single={true} />
  ├── <UserSelect label="Members" multiple={true} />
  ├── <TextArea label="Description" />
  └── <ButtonGroup save/cancel />
```

---

## 6. State Management Strategy

### 6.1 Global State (Zustand Stores)

#### Auth Store
```typescript
interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole;
  token: string | null;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}
```

#### Filter Store
```typescript
interface FilterStore {
  // State
  dateRange: [Date, Date] | null;
  selectedTeam: Team | null;
  selectedMember: User | null;
  selectedPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  searchQuery: string;
  viewMode: 'grid' | 'list';

  // Actions
  setDateRange: (range: [Date, Date]) => void;
  setTeam: (team: Team) => void;
  setMember: (member: User) => void;
  setPeriod: (period: string) => void;
  clearFilters: () => void;
}
```

#### UI Store
```typescript
interface UIStore {
  // State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: string) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}
```

### 6.2 Server State (TanStack Query)

```typescript
// Queries
useGetUserLogsQuery(userId, { dateRange, limit })
useGetTeamMembersQuery(teamId)
useGetActivityHeatmapQuery(userId, year)
useGetTeamsQuery()
useGetUsersQuery(filters)
useGetReportQuery(reportId)

// Mutations
useCreateLogMutation()
useUpdateLogMutation()
useDeleteLogMutation()
useCreateUserMutation()
useUpdateUserMutation()
useDeleteUserMutation()
useExportReportMutation()
```

### 6.3 Local Component State (useState)

```typescript
// Form states (delegate to React Hook Form)
const { register, handleSubmit, watch, formState } = useForm<LogForm>()

// UI states
const [showModal, setShowModal] = useState(false)
const [selectedDate, setSelectedDate] = useState(new Date())
const [isLoading, setIsLoading] = useState(false)

// Temporary states
const [tempFilters, setTempFilters] = useState(defaultFilters)
```

---

## 7. UI/UX Flows

### 7.1 Authentication Flow

```
┌──────────────────────────────┐
│   Landing / Login Page       │
├──────────────────────────────┤
│                              │
│  [Email Input]               │
│  [Password Input]            │
│  [Login Button]              │
│  [Forgot Password Link]      │
│  [Register Link]             │
│                              │
└──────────────────────────────┘
        ↓ (Submit)
     (Validate)
        ↓
    ✓ Success          ✗ Error
        ↓                 ↓
   (Get Token)      (Show Error)
        ↓
   (Store in LS)
        ↓
   (Navigate to Dashboard)
```

### 7.2 Daily Activity Logging Flow

```
Dashboard
  ↓ (Click "Add New Log" or date on heatmap)
Log Entry Page
  ├─ Select Date (default: today)
  ├─ Input Activity Description
  ├─ Upload Proof/Link
  ├─ Select Tags (optional)
  └─ [Save Button]
        ↓
   (Validate Form)
        ↓
   API Call: POST /logs
        ↓
    ✓ Success              ✗ Error
        ↓                     ↓
  (Update Cache)        (Show Error Toast)
  (Show Success Toast)
  (Redirect to Logs List)
```

### 7.3 Team Monitoring Flow

```
Dashboard
  ↓ (Team Leader clicks "Team" menu)
Team Overview
  ├─ Display Team Members Status
  ├─ Filter by Status (Completed/Pending/Overdue)
  └─ [View Details Button] or [Send Reminder]
        ↓
   (Show Member Details Modal)
        ├─ Member Name & Avatar
        ├─ Activity Timeline
        ├─ Missing Reports
        ├─ Last 5 Logs
        └─ [Action Buttons]
```

### 7.4 Report Generation & Export Flow

```
Dashboard → Team Leader/Admin
  ↓ (Click "Reports")
Reports Page
  ├─ Filter Panel
  │  ├─ Date Range Picker
  │  ├─ Period Selector (Daily/Weekly/Monthly)
  │  ├─ Team & Member Filters
  │  └─ [Apply Filters Button]
  │
  ├─ Report Preview
  │  ├─ Summary Stats (Total Logs, Avg per Day, etc.)
  │  ├─ Activity Breakdown (by person/team)
  │  ├─ Trend Chart
  │  └─ Detailed Table
  │
  └─ Export Options
     ├─ [Export as PDF Button]
     └─ [Export as Excel Button]
           ↓
      (Generate Document)
           ↓
      (Download to Device)
```

### 7.5 Role-Based Access Flow

```
User Logs In
  ↓
(Check User Role from Token)
  ├─ Employee
  │  ├─ Can: View own dashboard, create logs, view own logs
  │  └─ Dashboard → /dashboard/employee
  │
  ├─ Team Leader
  │  ├─ Can: Everything employee + monitor team + generate reports
  │  └─ Dashboard → /dashboard/team-leader
  │
  ├─ Department Head
  │  ├─ Can: Everything TL + view all teams + dept statistics
  │  └─ Dashboard → /dashboard/department-head
  │
  └─ Admin
     ├─ Can: Everything + user & team management
     └─ Dashboard → /dashboard/admin
```

---

## 8. Development Phases

### Phase 1: Foundation & Core Infrastructure (Weeks 1-3)

**Objectives:**
- Set up project structure, dev environment, build tools
- Implement authentication UI & routing
- Create base layout components
- Set up design system & Tailwind config
- Configure API integration layer

**Deliverables:**
1. Project initialization with Vite + React + TypeScript
2. Folder structure as documented
3. Tailwind CSS configured with color palette & typography
4. shadcn/ui components installed & basic variants created
5. Authentication pages (Login, Register, Forgot Password)
6. Layout components (Header, Sidebar, Footer)
7. Router setup with role-based redirects
8. API service layer with Axios
9. Zustand stores for auth & UI
10. Global error boundary & 404 page

**Components to Build:**
- `Layout` wrapper
- `Header` with user menu
- `Sidebar` with navigation
- `LoginForm`
- `RegisterForm`
- `ProtectedRoute`
- Basic `Button`, `Input`, `Card` components

---

### Phase 2: Employee Dashboard & Activity Logging (Weeks 4-6)

**Objectives:**
- Build activity heatmap visualization
- Create daily log entry form & management
- Implement progress tracking
- Set up TanStack Query for data fetching

**Deliverables:**
1. Activity Heatmap component (GitHub-style contribution graph)
2. Daily log creation form with validation
3. Logs list view with filtering & pagination
4. Log detail view
5. Progress bar component
6. Quick stats cards
7. TanStack Query hooks for logs operations
8. React Hook Form integration with Zod validation
9. Toast notifications for user feedback
10. Local caching strategy

**Components to Build:**
- `ActivityHeatmap`
- `LogForm`
- `LogsList`
- `LogDetailView`
- `ProgressTracker`
- `QuickStats`
- `StatCard`
- `EmployeeDashboard` page

---

### Phase 3: Team Leader & Monitoring Features (Weeks 7-8)

**Objectives:**
- Build team monitoring dashboard
- Create member status tracking
- Implement filter & search functionality
- Build reporting components

**Deliverables:**
1. Team Leader dashboard
2. Team member status overview with real-time updates
3. Member detail view
4. Team activity trends chart
5. Filter bar component with multi-select
6. Member search functionality
7. Report preview component
8. Basic report generation logic

**Components to Build:**
- `TeamLeaderDashboard` page
- `TeamMemberStatus`
- `MemberCard`
- `MemberDetailModal`
- `ActivityTrendChart`
- `FilterBar`
- `ReportPreview`

---

### Phase 4: Admin & Management Features (Weeks 9-10)

**Objectives:**
- Build user & team management interfaces
- Create admin dashboard
- Implement role-based UI access control

**Deliverables:**
1. Admin dashboard with system statistics
2. User management page (CRUD operations)
3. Team management page (CRUD operations)
4. Department Head dashboard
5. Advanced filtering for admin views
6. Bulk action capabilities (optional)

**Components to Build:**
- `AdminDashboard` page
- `DepartmentHeadDashboard` page
- `UserManagementPage`
- `TeamManagementPage`
- `UserDetailModal`
- `TeamDetailModal`
- `UserTable`
- `AdminActionBar`

---

### Phase 5: Export & Advanced Features (Weeks 11-12)

**Objectives:**
- Implement PDF & Excel export functionality
- Add advanced filtering & sorting
- Performance optimization
- Polish & refinement

**Deliverables:**
1. PDF export with formatted reports
2. Excel export with multiple sheets
3. Scheduled report generation (optional)
4. Advanced date range filtering
5. Custom chart configurations
6. Print-friendly views
7. Performance metrics monitoring
8. Comprehensive testing

**Components to Build:**
- `ExportPage`
- `ReportGenerator`
- `ScheduledReportsSetup` (optional)
- Enhanced `ReportPage`

---

### Phase 6: Testing, Documentation & Deployment (Weeks 13-14)

**Objectives:**
- Comprehensive testing coverage
- Performance optimization
- Documentation
- Prepare for production deployment

**Deliverables:**
1. Unit tests for all components (>70% coverage)
2. Integration tests for key flows
3. E2E tests for critical user paths
4. Performance audit & optimization
5. Accessibility audit (WCAG 2.1 AA)
6. Storybook documentation (optional)
7. README & development guide
8. Deployment setup (Vercel, Netlify, or custom)

---

## 9. Performance & Optimization

### 9.1 Code Splitting Strategy

```typescript
// Route-based code splitting
const EmployeeDashboard = lazy(() => import('./pages/dashboard/EmployeeDashboard'))
const TeamLeaderDashboard = lazy(() => import('./pages/dashboard/TeamLeaderDashboard'))
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'))

// With Suspense boundary
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
    <Route path="/dashboard/admin" element={<AdminDashboard />} />
  </Routes>
</Suspense>
```

### 9.2 Image & Asset Optimization

```
- Use WebP format with PNG fallback
- Implement lazy loading for images
- Optimize SVG assets
- Use CSS for simple icons (already with Lucide)
- Implement image compression in build process
```

### 9.3 Heatmap Performance Optimization

```typescript
// For large datasets (1000+ users):
- Use canvas-based rendering for heatmap
- Implement virtual scrolling for long lists
- Memoize heatmap data calculations
- Debounce filter operations
- Use Web Workers for heavy computations (optional)
```

### 9.4 Caching Strategy

```typescript
// TanStack Query Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,           // 5 minutes
      cacheTime: 10 * 60 * 1000,          // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Specific query configurations
useGetUserLogsQuery(userId, {
  staleTime: 2 * 60 * 1000,               // 2 minutes for logs
})

useGetTeamMembersQuery(teamId, {
  staleTime: 10 * 60 * 1000,              // 10 minutes for static data
})
```

### 9.5 Bundle Size Optimization

```
Target bundle size: < 200 KB (gzipped)

Strategies:
- Tree-shake unused code
- Lazy load heavy libraries (charts, export libs)
- Use dynamic imports for admin features
- Remove console logs in production
- Minify CSS and JS
- Use CDN for large dependencies (optional)
```

---

## 10. Accessibility & Best Practices

### 10.1 Accessibility Standards (WCAG 2.1 AA)

```
✓ Keyboard Navigation
  - All interactive elements accessible via Tab
  - Logical tab order
  - Escape key to close modals
  - Enter/Space to activate buttons

✓ Screen Reader Support
  - Semantic HTML (button, nav, main, section, etc.)
  - ARIA labels where needed
  - ARIA live regions for dynamic content
  - Form labels properly associated

✓ Color Contrast
  - Minimum 4.5:1 for text
  - Status not conveyed by color alone
  - Heatmap includes text labels/tooltips

✓ Focus Indicators
  - Visible focus rings (outline or custom)
  - High contrast focus states

✓ Mobile Accessibility
  - Touch targets minimum 44×44px
  - Responsive design
  - Touch-friendly interactions
```

### 10.2 Code Quality Standards

```
✓ TypeScript
  - Strict mode enabled
  - No `any` types without justification
  - Proper type exports

✓ Component Structure
  - Single Responsibility Principle
  - Presentational vs Container separation
  - Props interfaces well-defined
  - Meaningful component names

✓ Error Handling
  - Try-catch for async operations
  - User-friendly error messages
  - Error logging for debugging
  - Graceful degradation

✓ Testing
  - Unit tests for utils & hooks
  - Component tests for UI logic
  - Integration tests for user flows
  - E2E tests for critical paths
```

### 10.3 Security Best Practices

```
✓ Data Protection
  - No sensitive data in localStorage (use httpOnly cookies)
  - Token stored securely (consider using cookies instead of LS)
  - HTTPS required for API calls
  - Input sanitization for user-generated content

✓ Authentication
  - JWT with proper expiration
  - Refresh token rotation
  - CSRF protection
  - XSS prevention

✓ API Security
  - CORS properly configured
  - Rate limiting on frontend
  - API validation on backend (frontend is just UX)
```

### 10.4 Code Organization & Maintainability

```
✓ Naming Conventions
  - camelCase for variables, functions, hooks
  - PascalCase for components, types, classes
  - SCREAMING_SNAKE_CASE for constants
  - Descriptive names (avoid abbreviations)

✓ File Organization
  - Logical grouping by feature
  - Related files together
  - Consistent file naming
  - Clear index exports

✓ Documentation
  - JSDoc comments for exported functions
  - README for complex components
  - Inline comments for non-obvious logic
  - Type definitions as documentation

✓ Git Practices
  - Meaningful commit messages
  - Atomic commits (one logical change)
  - Feature branches for development
  - Code review before merge
```

---

## 11. Additional Considerations

### 11.1 Internationalization (i18n) - Optional Phase

```typescript
// Setup with i18next
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'id',
    supportedLngs: ['id', 'en'],
    ns: ['common', 'dashboard', 'logs', 'admin'],
  })

// Usage
const { t } = useTranslation('dashboard')
<h1>{t('title')}</h1>
```

### 11.2 Dark Mode Support

```typescript
// Tailwind dark mode with system preference
// In tailwind.config.ts
darkMode: 'class',

// Usage
<div className="dark:bg-slate-900 dark:text-white">
  Content
</div>

// Theme toggle in store
const UIStore = create((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light'
  }))
}))
```

### 11.3 PWA Capabilities (Optional)

```
- Service worker for offline support
- Web app manifest
- Install to home screen
- Offline data sync
- Push notifications
```

### 11.4 Analytics & Monitoring

```typescript
// Google Analytics or Segment
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useAnalytics() {
  const location = useLocation()
  
  useEffect(() => {
    // Track page view
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: location.pathname,
    })
  }, [location])
}
```

### 11.5 Error Tracking

```
- Sentry for error tracking
- LogRocket for session replay
- Custom error boundary
- Error logging service
```

---

## 12. Tools & Resources

### Development Tools
- VS Code with extensions (ESLint, Prettier, Thunder Client)
- React DevTools extension
- Zustand DevTools extension
- React Query DevTools

### Design & Prototyping
- Figma for design system
- Storybook for component documentation

### Testing Tools
- Vitest for unit tests
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

### Documentation
- Markdown for guides
- JSDoc for code documentation
- Storybook for interactive component docs

### Deployment
- Vercel (recommended for React/Vite)
- Netlify
- AWS Amplify
- Docker + custom server

---

## 13. Success Metrics

### User Experience Metrics
- Page load time: < 3 seconds (FCP < 1.5s)
- Time to Interactive (TTI): < 4 seconds
- Lighthouse score: > 85
- Cumulative Layout Shift: < 0.1
- Accessibility score: 100

### Development Metrics
- Code coverage: > 70%
- TypeScript strict mode: 100%
- Zero console errors in production
- Zero accessibility violations (WCAG 2.1 AA)

### Business Metrics
- User adoption rate
- Daily active users (DAU)
- Feature usage tracking
- User satisfaction surveys

---

## 14. Timeline Summary

```
Week 1-3:    Foundation & Infrastructure
Week 4-6:    Employee Dashboard & Logging
Week 7-8:    Team Monitoring
Week 9-10:   Admin & Management
Week 11-12:  Export & Advanced Features
Week 13-14:  Testing, Optimization & Deployment

Total: 14 weeks (3.5 months) for complete implementation
```

---

## Conclusion

Dokumen ini menyediakan blueprint komprehensif untuk mengembangkan frontend sistem pelaporan aktivitas harian. Dengan mengikuti struktur, fase, dan best practices yang telah dijelaskan, tim dapat membangun aplikasi yang:

1. **User-centric:** Interface intuitif dengan role-based dashboards
2. **Scalable:** Modular architecture yang mudah diperluas
3. **Performant:** Optimized loading dan caching strategies
4. **Accessible:** Compliant dengan WCAG standards
5. **Maintainable:** Clean code, well-documented, tested

Untuk pertanyaan atau klarifikasi lebih lanjut, silakan merujuk ke bagian spesifik dalam dokumen ini.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation