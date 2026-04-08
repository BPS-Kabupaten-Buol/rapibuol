# RAPIBUOL - Architecture Diagrams & Visual Reference

## Quick Navigation
1. [System Overview](#1-system-overview)
2. [Component Hierarchy](#2-component-hierarchy)
3. [State Management Flow](#3-state-management-flow)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [Page Navigation Map](#5-page-navigation-map)
6. [Role-Based Access Control](#6-role-based-access-control)
7. [Feature Module Structure](#7-feature-module-structure)
8. [Authentication Flow](#8-authentication-flow)
9. [Activity Heatmap Logic](#9-activity-heatmap-logic)
10. [User Journey Flows](#10-user-journey-flows)

---

## 1. System Overview

### Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                 │
│  (React Components + UI Layer + shadcn/ui)          │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Pages (Dashboard, Logs, Admin, Reports, etc) │  │
│  ├──────────────────────────────────────────────┤  │
│  │ Components (UI building blocks)              │  │
│  ├──────────────────────────────────────────────┤  │
│  │ Layout (Header, Sidebar, Footer)             │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                  STATE MANAGEMENT LAYER             │
│  (Zustand + React Query + Context)                  │
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ Auth Store   │ │ Filter Store │ │ UI Store   │ │
│  │ (User, Role) │ │ (Filters)    │ │ (Theme)    │ │
│  └──────────────┘ └──────────────┘ └────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ React Query (Server State & Cache)           │  │
│  │ - useGetLogs, useGetTeams, etc               │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER               │
│  (Custom Hooks + Utilities)                         │
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ useAuth      │ │ useLogs      │ │useTeams    │ │
│  │ useFilters   │ │ useExport    │ │useUsers    │ │
│  └──────────────┘ └──────────────┘ └────────────┘ │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                   SERVICE LAYER                     │
│  (API Calls + Data Processing)                      │
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ authService  │ │ logsService  │ │teamsService│ │
│  │ usersService │ │ reportService│ │exportService│ │
│  └──────────────┘ └──────────────┘ └────────────┘ │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                   API LAYER (Axios)                 │
│  Base URL: https://api.rapibuol.local/v1            │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                  BACKEND SERVICES                   │
│  (Node.js, Express, Database)                       │
└─────────────────────────────────────────────────────┘
```

---

## 2. Component Hierarchy

### Full Component Tree

```
<App>
  ├── <Router>
  │   ├── <ProtectedRoute>
  │   │   └── <Layout>
  │   │       ├── <Header>
  │   │       │   ├── <Logo>
  │   │       │   ├── <SearchBar>
  │   │       │   └── <UserMenu>
  │   │       │       ├── <Avatar>
  │   │       │       ├── <DropdownMenu>
  │   │       │       │   ├── Profile
  │   │       │       │   ├── Settings
  │   │       │       │   └── Logout
  │   │       │       └── <ThemeToggle>
  │   │       │
  │   │       ├── <Sidebar>
  │   │       │   └── <NavItem> × n
  │   │       │       └── <Icon> + <Label>
  │   │       │
  │   │       ├── <MainContent>
  │   │       │   ├── <Breadcrumb>
  │   │       │   └── {PageContent}
  │   │       │       ├── <DashboardPage>
  │   │       │       ├── <LogsPage>
  │   │       │       ├── <TeamMonitoringPage>
  │   │       │       ├── <ReportPage>
  │   │       │       ├── <AdminPage>
  │   │       │       └── ...
  │   │       │
  │   │       └── <ToastContainer>
  │   │           └── <Toast> × n
  │   │
  │   ├── <AuthPage>
  │   │   ├── <LoginForm>
  │   │   ├── <RegisterForm>
  │   │   └── <ForgotPasswordForm>
  │   │
  │   └── <ErrorPage>
  │       ├── <NotFound404>
  │       └── <ServerError500>
  │
  └── <ErrorBoundary>
```

### Dashboard Component Tree (Detailed)

```
<EmployeeDashboard>
  ├── <PageHeader>
  │   ├── <Title>
  │   └── <CTAButton> [Add New Log]
  │
  ├── <QuickStats>
  │   ├── <StatCard label="Today" value="3" icon="📊" />
  │   ├── <StatCard label="This Week" value="15" />
  │   └── <StatCard label="This Month" value="62" />
  │
  ├── <ActivityHeatmap>
  │   ├── <HeatmapHeader>
  │   │   ├── <YearSelector>
  │   │   └── <LegendControl>
  │   │
  │   ├── <HeatmapGrid>
  │   │   ├── <Month> × 12
  │   │   │   └── <Week> × 5
  │   │   │       └── <HeatmapCell> × 7
  │   │   │           ├── <ColorBox intensity={1-5} />
  │   │   │           ├── <Tooltip>
  │   │   │           │   ├── Date
  │   │   │           │   └── Count
  │   │   │           └── <OnClick> → Add Log Modal
  │   │   │
  │   │   └── <HeatmapLegend>
  │   │       ├── [■] No Activity
  │   │       ├── [■] Low
  │   │       ├── [■] Medium
  │   │       ├── [■] High
  │   │       └── [■] Very High
  │   │
  │   └── <HeatmapFooter>
  │       └── <ProgressBar percentage={85} />
  │
  ├── <ProgressTracker>
  │   ├── <ProgressLabel> "Weekly Target"
  │   ├── <ProgressBar current={18} target={20} />
  │   └── <ProgressStats> "18 of 20 logs (90%)"
  │
  ├── <RecentActivityFeed>
  │   ├── <FeedHeader>
  │   │   ├── <Title>
  │   │   └── <ViewAllLink>
  │   │
  │   └── <LogItems> × 5
  │       ├── <Date>
  │       ├── <ActivityPreview>
  │       └── <ProofLink>
  │
  └── <AddLogModal>
      ├── <FormGroup>
      │   ├── <DateInput />
      │   ├── <TextArea />
      │   ├── <FileUpload />
      │   ├── <TagSelector />
      │   └── <ButtonGroup>
      │       ├── [Cancel]
      │       └── [Save Log]
```

---

## 3. State Management Flow

### Global State Structure (Zustand)

```
                    ┌─────────────────────┐
                    │   Application       │
                    │   State Store       │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
      ┌─────────┐         ┌─────────┐         ┌─────────┐
      │Auth     │         │Filters  │         │UI State │
      │Store    │         │Store    │         │Store    │
      ├─────────┤         ├─────────┤         ├─────────┤
      │ user    │         │dateRange│         │theme    │
      │ token   │         │team     │         │sidebar  │
      │ role    │         │member   │         │modal    │
      │ isAuth  │         │period   │         │notif    │
      └────┬────┘         └────┬────┘         └────┬────┘
           │                   │                   │
           └───────────────────┼───────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ React Query Cache   │
                    │ (Server State)      │
                    ├─────────────────────┤
                    │ useGetLogs          │
                    │ useGetTeams         │
                    │ useGetDashboard     │
                    │ useGetUsers         │
                    │ useGetReports       │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Component Local     │
                    │ State (useState)    │
                    ├─────────────────────┤
                    │ form input state    │
                    │ modal visibility    │
                    │ loading states      │
                    │ temp filters        │
                    └─────────────────────┘
```

### Data Flow Within Component

```
User Interaction (Click, Input, Submit)
  ↓
Event Handler (onClick, onChange, onSubmit)
  ↓
Update Local State (useState)
  ↓
Form Validation (React Hook Form + Zod)
  ↓
Validation Success?
  ├─ NO  → Show Error Message
  │       └─ User Corrects Input
  │
  └─ YES → API Call via Mutation
           (useMutation from React Query)
           ↓
        API Request to Backend
           ↓
        Response Handler
           ├─ Success → Update Cache (queryClient.setQueryData)
           │           → Update Zustand Store (if needed)
           │           → Show Success Toast
           │           → Update UI (re-render)
           │           → Optional: Navigate to new page
           │
           └─ Error → Show Error Toast
                      → Optionally: Retry Logic
                      → Optional: Log to Error Tracking
```

---

## 4. Data Flow Architecture

### Complete Request-Response Cycle

```
┌──────────────────────────────────────────────────────────────┐
│                  FRONTEND (React App)                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  User Action (e.g., Add Log)                                │
│         ↓                                                     │
│  Component Handler                                           │
│  └─ <LogForm onSubmit={handleAddLog} />                     │
│         ↓                                                     │
│  React Hook Form + Zod Validation                           │
│  ├─ Validate: date, description, proofLink                 │
│  └─ If valid → continue                                     │
│         ↓                                                     │
│  useAddLogMutation Hook                                      │
│  ├─ Set loading state                                       │
│  └─ Call API Service                                        │
│         ↓                                                     │
│  API Service (logsService.addLog)                           │
│  ├─ Prepare request body                                    │
│  ├─ Add auth token to headers                               │
│  └─ Make HTTP POST request via Axios                        │
│         ↓                                                     │
├──────────────────────────────────────────────────────────────┤
│              NETWORK LAYER (HTTP)                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  POST /api/v1/logs                                           │
│  Headers: {                                                  │
│    Authorization: "Bearer {token}",                          │
│    Content-Type: "application/json"                          │
│  }                                                            │
│  Body: {                                                     │
│    date: "2024-01-15",                                       │
│    description: "Completed task...",                         │
│    proofLink: "https://...",                                 │
│    tags: ["dev", "bug-fix"]                                  │
│  }                                                            │
│         ↓                                                     │
├──────────────────────────────────────────────────────────────┤
│                  BACKEND (Node.js/Express)                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  API Endpoint Handler (logsController.addLog)                │
│  ├─ Verify JWT Token                                        │
│  ├─ Validate Request Body                                   │
│  ├─ Check Authorization (owner or team lead)                │
│  └─ Continue                                                │
│         ↓                                                     │
│  Business Logic                                              │
│  ├─ Calculate intensity score                               │
│  ├─ Prepare document                                        │
│  └─ Save to Database                                        │
│         ↓                                                     │
│  Database Operation                                          │
│  └─ INSERT INTO activity_logs (...)                         │
│         ↓                                                     │
│  Response Preparation                                        │
│  ├─ Status: 201 Created                                     │
│  ├─ Body: { id, date, description, ... }                   │
│  └─ Send Response                                           │
│         ↓                                                     │
├──────────────────────────────────────────────────────────────┤
│              NETWORK LAYER (HTTP Response)                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  201 Created                                                 │
│  { id: "abc123", date: "2024-01-15", ... }                  │
│         ↓                                                     │
├──────────────────────────────────────────────────────────────┤
│                  FRONTEND (React App)                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Response Handler                                            │
│         ↓                                                     │
│  Success Branch                                              │
│  ├─ Set loading = false                                     │
│  ├─ queryClient.invalidateQueries('logs')                   │
│  │   (or setQueryData to update cache)                      │
│  ├─ updateAuthStore() if needed                             │
│  ├─ Show Success Toast: "Log added!"                        │
│  ├─ Reset Form                                              │
│  └─ Close Modal / Navigate                                  │
│         ↓                                                     │
│  Component Re-render                                         │
│  ├─ Heatmap updates (new cell colored)                      │
│  ├─ Stats update (count increases)                          │
│  └─ UI reflects new data                                    │
│         ↓                                                     │
│  User sees success and updated dashboard                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Page Navigation Map

### Complete Route Tree

```
ROOT (/)
│
├── 🔓 PUBLIC ROUTES
│   ├── /login
│   │   └── <LoginForm>
│   │       ├── Email input
│   │       ├── Password input
│   │       └── [Login Button]
│   │
│   ├── /register
│   │   └── <RegisterForm>
│   │       ├── Name input
│   │       ├── Email input
│   │       ├── Password input
│   │       └── [Register Button]
│   │
│   └── /forgot-password
│       └── <ForgotPasswordForm>
│           ├── Email input
│           └── [Send Reset Email]
│
├── 🔐 PROTECTED ROUTES (Requires Authentication)
│   │
│   ├── /dashboard (Role-based redirect)
│   │   ├─ Employee → /dashboard/employee
│   │   ├─ Team Lead → /dashboard/team-leader
│   │   ├─ Dept Head → /dashboard/department-head
│   │   └─ Admin → /dashboard/admin
│   │
│   ├── /dashboard/employee
│   │   └── <EmployeeDashboard>
│   │       ├── Heatmap
│   │       ├── Quick stats
│   │       ├── Progress tracker
│   │       └── Recent logs
│   │
│   ├── /dashboard/team-leader
│   │   └── <TeamLeaderDashboard>
│   │       ├── Team status
│   │       ├── Member overview
│   │       ├── Team heatmap
│   │       └── Performance trends
│   │
│   ├── /dashboard/department-head
│   │   └── <DepartmentHeadDashboard>
│   │       ├── Department overview
│   │       ├── Team comparison
│   │       ├── Analytics
│   │       └── Department heatmap
│   │
│   ├── /dashboard/admin
│   │   └── <AdminDashboard>
│   │       ├── System stats
│   │       ├── User management
│   │       ├── Team management
│   │       └── System health
│   │
│   ├── /logs
│   │   └── <LogsListPage>
│   │       ├── Filter bar
│   │       ├── Search
│   │       ├── Logs list
│   │       └── Pagination
│   │
│   ├── /logs/new
│   │   └── <CreateLogPage>
│   │       └── <LogForm> (Create mode)
│   │
│   ├── /logs/:id
│   │   └── <LogDetailPage>
│   │       ├── Full log content
│   │       ├── Proof/attachment
│   │       ├── Edit button
│   │       └── Delete button
│   │
│   ├── /logs/:id/edit
│   │   └── <EditLogPage>
│   │       └── <LogForm> (Edit mode)
│   │
│   ├── /monitoring/team (TL+)
│   │   └── <TeamMonitoringPage>
│   │       ├── Team selector
│   │       ├── Member status cards
│   │       ├── Team heatmap
│   │       └── Filter options
│   │
│   ├── /monitoring/team/:teamId (TL+)
│   │   └── <TeamDetailPage>
│   │       ├── Team info
│   │       ├── Member list
│   │       └── Team analytics
│   │
│   ├── /monitoring/members/:memberId (TL+)
│   │   └── <MemberDetailPage>
│   │       ├── Member info
│   │       ├── Individual heatmap
│   │       ├── Activity history
│   │       └── Performance metrics
│   │
│   ├── /reports (TL+)
│   │   └── <ReportsPage>
│   │       ├── Report generator
│   │       ├── Filters
│   │       ├── Preview
│   │       └── Export options
│   │
│   ├── /management/users (Admin)
│   │   └── <UsersPage>
│   │       ├── User table
│   │       ├── Add user button
│   │       ├── Search & filter
│   │       └── Edit/Delete actions
│   │
│   ├── /management/users/:id (Admin)
│   │   └── <UserDetailPage>
│   │       ├── User info form
│   │       ├── Role assignment
│   │       ├── Team assignment
│   │       └── Save button
│   │
│   ├── /management/teams (Admin)
│   │   └── <TeamsPage>
│   │       ├── Team table/grid
│   │       ├── Create team button
│   │       ├── Search & filter
│   │       └── Edit/Delete actions
│   │
│   ├── /management/teams/:id (Admin)
│   │   └── <TeamDetailPage>
│   │       ├── Team info form
│   │       ├── Team leader select
│   │       ├── Member assignment
│   │       └── Save button
│   │
│   ├── /settings
│   │   └── <SettingsPage>
│   │       ├── Profile settings
│   │       ├── Preferences
│   │       ├── Notifications
│   │       └── Security
│   │
│   └── /profile
│       └── <ProfilePage>
│           ├── User info
│           ├── Statistics
│           └── Edit profile button
│
├── ❌ ERROR ROUTES
│   ├── /404
│   │   └── <NotFoundPage>
│   │
│   ├── /500
│   │   └── <ServerErrorPage>
│   │
│   └── /unauthorized
│       └── <UnauthorizedPage>
│
└── * (Catch all)
    └── Redirect to /404
```

---

## 6. Role-Based Access Control

### Permission Matrix

```
┌─────────────────────┬──────────┬────────────┬──────────────┬───────┐
│ Feature             │ Employee │ Team Lead  │ Dept Head    │ Admin │
├─────────────────────┼──────────┼────────────┼──────────────┼───────┤
│ View Own Heatmap    │    ✓     │     ✓      │      ✓       │   ✓   │
│ Create Own Logs     │    ✓     │     ✓      │      ✓       │   ✓   │
│ Edit Own Logs       │    ✓     │     ✓      │      ✓       │   ✓   │
│ Delete Own Logs     │    ✓     │     ✓      │      ✓       │   ✓   │
│                     │          │            │              │       │
│ View Team Heatmap   │    ✗     │     ✓      │      ✓       │   ✓   │
│ View Team Logs      │    ✗     │     ✓      │      ✓       │   ✓   │
│ Verify Logs         │    ✗     │     ✓      │      ✓       │   ✓   │
│ View Team Members   │    ✗     │     ✓      │      ✓       │   ✓   │
│ Monitor Team        │    ✗     │     ✓      │      ✓       │   ✓   │
│                     │          │            │              │       │
│ View Dept Stats     │    ✗     │     ✗      │      ✓       │   ✓   │
│ View All Teams      │    ✗     │     ✗      │      ✓       │   ✓   │
│ Export Reports      │    ✗     │     ✓      │      ✓       │   ✓   │
│ View Dept Heatmap   │    ✗     │     ✗      │      ✓       │   ✓   │
│                     │          │            │              │       │
│ Manage Users        │    ✗     │     ✗      │      ✗       │   ✓   │
│ Manage Teams        │    ✗     │     ✗      │      ✗       │   ✓   │
│ Manage Roles        │    ✗     │     ✗      │      ✗       │   ✓   │
│ System Settings     │    ✗     │     ✗      │      ✗       │   ✓   │
└─────────────────────┴──────────┴────────────┴──────────────┴───────┘
```

### Navigation Tree by Role

```
EMPLOYEE Dashboard
├── My Dashboard
│   ├── Activity Heatmap
│   ├── Quick Stats
│   ├── Progress Tracker
│   └── Recent Logs
├── My Logs
│   ├── New Log
│   ├── View Logs
│   └── View History
├── My Statistics
│   ├── Activity Trends
│   ├── Achievements
│   └── Performance
└── Settings
    ├── Profile
    ├── Preferences
    └── Logout

TEAM LEAD Dashboard (+ Employee features)
├── Team Dashboard
│   ├── Team Heatmap
│   ├── Member Status
│   ├── Performance Trends
│   └── Quick Actions
├── My Team Members
│   ├── Team Overview
│   ├── Member Details
│   └── Team Analytics
├── Reports
│   ├── Generate Reports
│   ├── Multi-view Filters
│   └── Export Options
└── Settings
    ├── Profile
    ├── Team Preferences
    └── Logout

DEPARTMENT HEAD Dashboard (+ Team Lead features)
├── Department Overview
│   ├── Department Stats
│   ├── Team Comparison
│   ├── Overall Performance
│   └── KPIs
├── Teams Management
│   ├── All Teams
│   ├── Team Performance
│   ├── Workload Distribution
│   └── Bottleneck Analysis
├── Department Analytics
│   ├── Advanced Filters
│   ├── Trend Analysis
│   ├── Custom Reports
│   └── Export Reports
└── Settings
    ├── Department Config
    ├── Notification Settings
    └── Logout

ADMIN Dashboard (+ All features)
├── System Overview
│   ├── System Stats
│   ├── User Activity
│   ├── System Health
│   └── Performance Metrics
├── User Management
│   ├── Add User
│   ├── Manage Users
│   ├── Bulk Import
│   └── User Deactivation
├── Team Management
│   ├── Create Team
│   ├── Manage Teams
│   ├── Assign Leaders
│   └── Reorganize Structure
├── Roles & Permissions
│   ├── Role Configuration
│   ├── Permission Matrix
│   └── Access Control
├── System Configuration
│   ├── General Settings
│   ├── Notification Templates
│   ├── Report Templates
│   └── System Logs
└── Settings
    ├── Admin Profile
    ├── System Preferences
    └── Logout
```

---

## 7. Feature Module Structure

### Modular Feature Organization

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPasswordForm.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   └── types/
│   │       └── auth.types.ts
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── ActivityHeatmap.tsx
│   │   │   ├── QuickStats.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   └── RecentLogs.tsx
│   │   ├── pages/
│   │   │   ├── EmployeeDashboard.tsx
│   │   │   ├── TeamLeaderDashboard.tsx
│   │   │   ├── DepartmentHeadDashboard.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── hooks/
│   │   │   └── useDashboardStats.ts
│   │   ├── services/
│   │   │   └── dashboardService.ts
│   │   └── types/
│   │       └── dashboard.types.ts
│   │
│   ├── logs/
│   │   ├── components/
│   │   │   ├── LogForm.tsx
│   │   │   ├── LogList.tsx
│   │   │   ├── LogEntry.tsx
│   │   │   └── LogFilter.tsx
│   │   ├── pages/
│   │   │   ├── LogsPage.tsx
│   │   │   ├── CreateLogPage.tsx
│   │   │   ├── EditLogPage.tsx
│   │   │   └── LogDetailPage.tsx
│   │   ├── hooks/
│   │   │   ├── useLogs.ts
│   │   │   └── useLogForm.ts
│   │   ├── services/
│   │   │   └── logsService.ts
│   │   └── types/
│   │       └── log.types.ts
│   │
│   ├── monitoring/
│   │   ├── components/
│   │   │   ├── TeamStatus.tsx
│   │   │   ├── MemberCard.tsx
│   │   │   ├── TeamAnalytics.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── pages/
│   │   │   ├── TeamMonitoringPage.tsx
│   │   │   ├── TeamDetailPage.tsx
│   │   │   ├── MemberDetailPage.tsx
│   │   │   └── ReportsPage.tsx
│   │   ├── hooks/
│   │   │   ├── useTeamMembers.ts
│   │   │   └── useReports.ts
│   │   ├── services/
│   │   │   ├── monitoringService.ts
│   │   │   └── reportService.ts
│   │   └── types/
│   │       └── monitoring.types.ts
│   │
│   ├── management/
│   │   ├── components/
│   │   │   ├── UserTable.tsx
│   │   │   ├── UserForm.tsx
│   │   │   ├── TeamTable.tsx
│   │   │   └── TeamForm.tsx
│   │   ├── pages/
│   │   │   ├── UsersPage.tsx
│   │   │   ├── UserDetailPage.tsx
│   │   │   ├── TeamsPage.tsx
│   │   │   ├── TeamDetailPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── hooks/
│   │   │   ├── useUsers.ts
│   │   │   ├── useTeams.ts
│   │   │   └── useManagement.ts
│   │   ├── services/
│   │   │   ├── usersService.ts
│   │   │   └── teamsService.ts
│   │   └── types/
│   │       └── management.types.ts
│   │
│   └── common/
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── Header.tsx
│       │   ├── Sidebar.tsx
│       │   ├── Breadcrumb.tsx
│       │   └── ToastContainer.tsx
│       ├── hooks/
│       │   ├── useNavigation.ts
│       │   └── useNotification.ts
│       └── types/
│           └── common.types.ts
```

---

## 8. Authentication Flow

### Complete Authentication Sequence

```
┌─────────────────────────────────────────────────────────────┐
│                    USER VISITS APP                          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Check localStorage │
                    │ for auth token     │
                    └────────┬───────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
         Token exists?              No token
                │                         │
         ┌──────┴──────┐            Redirect to
         │             │            /login page
         ▼             ▼            │
   Token valid?   Verify Token      ▼
         │         (API call)   ┌─────────────┐
         │             │         │ LoginPage   │
    ┌────┴────┐     ┌──┴──┐     ├─────────────┤
    │          │     │     │     │ Form input: │
   YES        NO    YES   NO     │ - Email     │
    │          │     │     │     │ - Password  │
    │          │     │     │     └─────┬───────┘
    │          │     │     │           │
    │          │     │     │    User Submits
    │          │     │     │           │
    │          │     │     ▼           ▼
    │          │     │  Delete Token   POST /auth/login
    │          │     │  from LS        {email, password}
    │          │     │     │           │
    │          │     │     │      API processes
    │          └─────┴─────┤           │
    │                      │      ┌────┴────┐
    │                      │      │          │
    │                      ▼      ▼          ▼
    │                    REDIRECT    Invalid   Server
    │                    to login    Creds     Error
    │                              │          │
    │                              ▼          ▼
    │                           Show Error   Show Error
    │                           Message      Message
    │                              │          │
    │                              └─────┬────┘
    │                                    │
    │                                    ▼
    │                             User Re-attempts
    │                                    │
    ▼                                    │
Set Auth Context/Store        ┌─────────┴──────────┐
├─ User object                │                    │
├─ Token to localStorage       Success (eventually)
├─ Role in global state        │
├─ Set isAuthenticated = true  ▼
│                          ┌──────────────────────┐
▼                          │ API returns:         │
Get User Dashboard          │ {                   │
├─ Fetch initial data       │   token: "jwt...",  │
├─ Redirect based on role   │   user: {           │
│  - Employee → /dashboard/employee  │   id,       │
│  - TL → /dashboard/team-leader     │   name,     │
│  - DH → /dashboard/department-head │   role,     │
│  - Admin → /dashboard/admin        │   email     │
│                                     │   }         │
                                      │ }           │
                                      └──────────────┘
                                            │
                                            ▼
                                       ┌──────────────────┐
                                       │ Store in Memory: │
                                       │ - AuthStore      │
                                       │ - React Query    │
                                       │                  │
                                       │ Store in LS:     │
                                       │ - JWT Token      │
                                       │ - User ID        │
                                       └────────┬─────────┘
                                               │
                                               ▼
                                       ┌──────────────────┐
                                       │ User Logged In   │
                                       │ & Authenticated  │
                                       └──────────────────┘

LOGOUT FLOW:
┌──────────────────────────────────────────────┐
│ User Clicks Logout                           │
├──────────────────────────────────────────────┤
│ Clear localStorage (token, userId)           │
│ Clear AuthStore (user, token, role)          │
│ Clear React Query Cache (invalidate all)     │
│ Clear UI state                               │
│ Redirect to /login                           │
└──────────────────────────────────────────────┘
```

---

## 9. Activity Heatmap Logic

### Heatmap Data Structure & Rendering

```
┌─────────────────────────────────────────────────────┐
│           HEATMAP DATA GENERATION                   │
└─────────────────────────────────────────────────────┘

Backend calculates intensity for each day:
┌─────────────────────────────────────────────────────┐
│ For each user + date:                               │
│ 1. Count activity logs for that day                 │
│ 2. Calculate intensity score (0-5):                 │
│    - 0: No activity                                 │
│    - 1: 1-2 logs                                    │
│    - 2: 3-4 logs                                    │
│    - 3: 5-6 logs                                    │
│    - 4: 7-8 logs                                    │
│    - 5: 9+ logs (or weighted by character count)    │
│ 3. Return: [{date, count, intensity}, ...]         │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
        ┌────────────────────────────┐
        │ Frontend receives data      │
        └────────┬───────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ heatmapData = [             │
    │   {                         │
    │     date: "2024-01-01",     │
    │     count: 3,               │
    │     intensity: 2,           │
    │     percentage: 40          │
    │   },                        │
    │   {                         │
    │     date: "2024-01-02",     │
    │     count: 7,               │
    │     intensity: 4,           │
    │     percentage: 100         │
    │   },                        │
    │   ...                       │
    │ ]                           │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ React component renders      │
    │ calendar grid (52w × 7d)     │
    └────────────┬────────────────┘
                 │
     ┌───────────┴────────────┐
     │                        │
     ▼                        ▼
Monthly Headers          Grid Cells
Jan | Feb | Mar...       ┌──┬──┬──┬──┬──┬──┬──┐
                         │  │▓▓│▓▓│░░│▓▓│  │▓▓│ Week 1
                         ├──┼──┼──┼──┼──┼──┼──┤
                         │▓▓│  │▓▓│░░│▓▓│▓▓│  │ Week 2
                         └──┴──┴──┴──┴──┴──┴──┘
                         
                         Color mapping:
                         - ░░ = Empty (no activity)
                         - ▒▒ = Low (1-2 logs)
                         - ▓▓ = Medium (3-4 logs)
                         - ■■ = High (5-6 logs)
                         - ◆◆ = Very High (7+ logs)
```

### Heatmap Component Tree

```
<ContributionHeatmap>
  ├── <HeatmapHeader>
  │   ├── Year Selector [◄ 2024 ►]
  │   ├── Legend Toggle [Show/Hide]
  │   └── View Options [12 months / 3 months / Custom]
  │
  ├── <HeatmapGrid>
  │   ├── <MonthRow>
  │   │   └── Month Label (Jan, Feb, etc)
  │   │
  │   └── <WeekColumn> × 52
  │       ├── <DayLabel> (Mon, Tue, Wed...)
  │       │
  │       └── <HeatmapCell> × 7
  │           ├── Background color (based on intensity)
  │           ├── Hover effects
  │           ├── Tooltip on hover
  │           │   ├── Date
  │           │   ├── Log count
  │           │   ├── Contribution level
  │           │   └── [View Details] link
  │           │
  │           ├── Click handler
  │           │   └─ Open Log Entry Modal
  │           │
  │           └── Data attributes
  │               ├── data-date
  │               ├── data-intensity
  │               └── data-count
  │
  ├── <HeatmapLegend>
  │   ├── ░░ No Contribution
  │   ├── ▒▒ Low (1-2)
  │   ├── ▓▓ Medium (3-4)
  │   ├── ■■ High (5-6)
  │   └── ◆◆ Very High (7+)
  │
  └── <HeatmapFooter>
      ├── Statistics
      │   ├─ Total contributions: XXX
      │   ├─ Current streak: XXX days
      │   ├─ Longest streak: XXX days
      │   └─ Average per day: X.X
      │
      └── Export button
          └─ Download as image/PDF
```

### Data Transformation Pipeline

```
Raw Data (from API):
┌──────────────────────┐
│ {                    │
│   logs: [            │
│     {                │
│       id: "1",       │
│       date: "2024-01-15T10:30:00Z",
│       description: "...",
│       userId: "123"
│     },
│     {
│       id: "2",
│       date: "2024-01-15T14:20:00Z",
│       description: "...",
│       userId: "123"
│     }
│   ]
│ }
└──────────────────────┘
         │
         ▼ Group by date
┌──────────────────────┐
│ {                    │
│   "2024-01-15": [    │ ← 2 logs
│     log1,            │
│     log2             │
│   ],                 │
│   "2024-01-14": [    │ ← 1 log
│     log3             │
│   ]                  │
│ }                    │
└──────────────────────┘
         │
         ▼ Calculate intensity
┌──────────────────────┐
│ [                    │
│   {                  │
│     date: "2024-01-15",
│     count: 2,        │ ← count of logs
│     intensity: 1,    │ ← 1-5 scale
│     color: "#7BC67B" │ ← hex color
│   },                 │
│   {                  │
│     date: "2024-01-14",
│     count: 1,        │
│     intensity: 0,    │
│     color: "#EEEEEE" │
│   }                  │
│ ]                    │
└──────────────────────┘
         │
         ▼ Pad missing dates
┌──────────────────────┐
│ [                    │
│   {                  │
│     date: "2024-01-13",
│     count: 0,        │ ← no logs
│     intensity: 0,    │
│     color: "#EEEEEE" │
│   },                 │
│   {                  │
│     date: "2024-01-14",
│     count: 1,        │
│     intensity: 0,    │
│     color: "#EEEEEE" │
│   },                 │
│   {                  │
│     date: "2024-01-15",
│     count: 2,        │
│     intensity: 1,    │
│     color: "#7BC67B" │
│   }                  │
│ ]                    │
└──────────────────────┘
         │
         ▼ Render in UI
    [Heatmap Visual]
```

---

## 10. User Journey Flows

### Employee Daily Flow

```
┌─────────────────────────────────────────────────────┐
│                EMPLOYEE DAILY FLOW                  │
└─────────────────────────────────────────────────────┘

START OF DAY
│
├─ 8:00 AM - Employee Opens App
│  └─ Auto-redirect to /dashboard/employee
│     (if already logged in)
│
└─ LANDING: Employee Dashboard
   ┌──────────────────────────────────────┐
   │ Welcome Back, [Name]!                │
   │ Today: January 15, 2024              │
   ├──────────────────────────────────────┤
   │ STATUS: ❌ Not logged yet            │
   │ This Week: 4/5 completed             │
   │ Progress: ████░░░░░░ 80%             │
   ├──────────────────────────────────────┤
   │ [+ ADD LOG] [VIEW DETAILS] [FILTER] │
   └──────────────────────────────────────┘

DECISION POINT 1: Add Activity Log
│
├─ Click [+ ADD LOG] Button
│  │
│  └─ Modal Opens: Add Activity Log
│     ┌─────────────────────────────────┐
│     │ Add Activity Log           [X]  │
│     ├─────────────────────────────────┤
│     │ Date: [Today ▼]                 │
│     │ Activity: [Textarea...]         │
│     │          "Finished meeting..." │
│     │ Proof Link: [Optional URL]      │
│     │ Tags: [Documentation]           │
│     ├─────────────────────────────────┤
│     │ [Cancel]  [Save Log]            │
│     └─────────────────────────────────┘
│
│  └─ Click [Save Log]
│     │
│     ▼ Form validates
│     ├─ Description min 20 chars? ✓
│     ├─ Valid URL (if provided)? ✓
│     └─ Date valid? ✓
│
│     ▼ Submit to API
│     POST /api/v1/logs
│
│     ▼ Success Response
│     ├─ Update Heatmap (cell color changes)
│     ├─ Update Stats (count increases)
│     ├─ Show toast: "✅ Log saved!"
│     └─ Modal closes
│
│  BACK TO: Dashboard with updated data
│  ┌──────────────────────────────────────┐
│  │ Welcome Back, [Name]!                │
│  │ Today: January 15, 2024              │
│  ├──────────────────────────────────────┤
│  │ STATUS: ✅ Logged today              │
│  │ Total Today: 1 log                   │
│  │ This Week: 5/5 completed             │
│  │ Progress: █████░░░░░ 100%            │
│  ├──────────────────────────────────────┤
│  │ [+ ADD LOG] [VIEW DETAILS] [FILTER] │
│  └──────────────────────────────────────┘
│
├─ OR Click on Heatmap Cell (Alternative)
│  │
│  └─ Same flow as above
│
└─ OR Click [VIEW DETAILS]
   │
   └─ Navigate to /logs
      ┌────────────────────────────────┐
      │ My Activity Logs               │
      ├────────────────────────────────┤
      │ [Filter] [Search] [New Log]    │
      ├────────────────────────────────┤
      │ • Jan 15 (TODAY)               │
      │   "Finished meeting..."        │
      │   [Edit] [View] [Delete]       │
      │                                │
      │ • Jan 14                       │
      │   "Development work..."        │
      │   [Edit] [View] [Delete]       │
      │                                │
      │ • Jan 13                       │
      │   "Documentation..."           │
      │   [Edit] [View] [Delete]       │
      └────────────────────────────────┘

THROUGHOUT DAY
│
├─ Employee can add multiple logs
│  └─ Heatmap updates in real-time
│     (shows current contribution level)
│
├─ Employee can view/edit logs
│  └─ Click on log entry
│     └─ Navigate to /logs/[id]
│
└─ View Statistics
   └─ Click [Statistics] in sidebar
      └─ See trends, streaks, achievements

END OF DAY / LATER REVIEW
│
└─ Dashboard shows:
   ✅ Status: Logged today (1+ times)
   📊 Visual green on heatmap cell
   🎉 Streak counter updates
```

### Team Lead Monitoring Flow

```
┌─────────────────────────────────────────────────────┐
│             TEAM LEAD MONITORING FLOW               │
└─────────────────────────────────────────────────────┘

MORNING CHECK-IN (9:00 AM)
│
└─ Team Lead Opens App
   └─ Redirect to /dashboard/team-leader
      ┌──────────────────────────────────────┐
      │ Team Dashboard - Engineering         │
      │ Members: 5  |  Today's Status        │
      ├──────────────────────────────────────┤
      │ ✅ Logged: 4/5                        │
      │ ⏳ Not logged: 1/5                    │
      │ Performance: ████░░ 80%              │
      ├──────────────────────────────────────┤
      │ TEAM MEMBER STATUS:                  │
      │ ┌──────────────────────────────────┐│
      │ │ John Doe       ✅ 10:00 AM      ││
      │ │ Jane Smith     ✅ 09:45 AM      ││
      │ │ Bob Johnson    ✅ 09:30 AM      ││
      │ │ Alice Wilson   ⏳ Not yet        ││
      │ │ Charlie Brown  ✅ 09:15 AM      ││
      │ └──────────────────────────────────┘│
      └──────────────────────────────────────┘

DECISION POINT: Review Pending
│
├─ See Alice Wilson hasn't logged
│  │
│  ├─ Quick Action: [Send Reminder]
│  │  └─ Modal: Send notification to Alice
│  │     │
│  │     └─ "Please submit your activity log"
│  │        └─ Send button
│  │           └─ Notification sent
│  │
│  └─ OR Drill-down: Click on Alice's card
│     │
│     └─ Navigate to /monitoring/members/alice-id
│        ┌─────────────────────────────────────┐
│        │ Alice Wilson - Performance Review   │
│        ├─────────────────────────────────────┤
│        │ Status: Not logged today            │
│        │ Last log: Yesterday, 2:30 PM        │
│        │ This week: 4/5 logs                 │
│        │ Performance: ████░░ 80%             │
│        ├─────────────────────────────────────┤
│        │ Individual Heatmap (Last 3 months) │
│        │ [Visual heatmap]                    │
│        ├─────────────────────────────────────┤
│        │ Recent Logs:                        │
│        │ • Jan 14: "..." [View] [Verify]    │
│        │ • Jan 13: "..." [View] [Verify]    │
│        │ • Jan 12: "..." [View] [Verify]    │
│        ├─────────────────────────────────────┤
│        │ Actions:                            │
│        │ [Send Message] [Reassign] [Remove] │
│        └─────────────────────────────────────┘

MID-DAY TEAM REVIEW
│
└─ Click [Team Monitoring] in sidebar
   │
   └─ Navigate to /monitoring/team
      ┌──────────────────────────────────────┐
      │ Team Monitoring - Engineering        │
      ├──────────────────────────────────────┤
      │ [Filter: Team ▼] [Filter: Status ▼] │
      │ [Date Range] [Export Report]         │
      ├──────────────────────────────────────┤
      │ TEAM ACTIVITY HEATMAP                │
      │ [Combined view of all team members]  │
      │                                      │
      │ [Weekly Trend Chart]                 │
      │ Mon: 15 logs                         │
      │ Tue: 18 logs                         │
      │ Wed: 16 logs                         │
      │ Thu: 19 logs                         │
      │ Fri: 14 logs                         │
      │                                      │
      │ [Anomalies Detected]                 │
      │ • Bob: Low activity (2 logs today)  │
      │   Avg: 5 logs                        │
      └──────────────────────────────────────┘

END OF DAY / REPORTING
│
└─ Generate Report
   │
   ├─ Click [Reports] in sidebar
   │  │
   │  └─ Navigate to /reports
   │     ┌───────────────────────────────────┐
   │     │ Reports & Export                  │
   │     ├───────────────────────────────────┤
   │     │ Period: [Today ▼]                 │
   │     │ Teams: [Engineering ▼]            │
   │     │ Members: [All ▼]                  │
   │     │ [Apply Filters]                   │
   │     ├───────────────────────────────────┤
   │     │ REPORT PREVIEW:                   │
   │     │ Team: Engineering                 │
   │     │ Date: Jan 15, 2024                │
   │     │ Total Logs: 18                    │
   │     │ Target: 20                        │
   │     │ Completion: 90%                   │
   │     ├───────────────────────────────────┤
   │     │ [Export as PDF] [Export as Excel] │
   │     └───────────────────────────────────┘
   │
   └─ Download report for records/stakeholder sharing

NEXT STEPS
│
└─ Team Lead can:
   ├─ Continue monitoring throughout the day
   ├─ Verify logs from team members (if needed)
   ├─ Adjust reminders/escalations
   └─ Generate additional reports as needed
```

### Admin Setup Flow

```
┌─────────────────────────────────────────────────────┐
│               ADMIN INITIAL SETUP FLOW              │
└─────────────────────────────────────────────────────┘

ADMIN LOGS IN
│
└─ Redirect to /dashboard/admin
   ┌──────────────────────────────────────┐
   │ Admin Dashboard                      │
   ├──────────────────────────────────────┤
   │ System Statistics                    │
   │ Total Users: 0                       │
   │ Total Teams: 0                       │
   │ System Health: ✅ Good               │
   ├──────────────────────────────────────┤
   │ Quick Setup Wizard (if new):         │
   │ [ ] Create Teams                     │
   │ [ ] Add Users                        │
   │ [ ] Configure Roles                  │
   └──────────────────────────────────────┘

STEP 1: CREATE TEAMS
│
├─ Click [Team Management] in sidebar
│  │
│  └─ Navigate to /management/teams
│     ┌──────────────────────────────────────┐
│     │ Team Management                      │
│     ├──────────────────────────────────────┤
│     │ [+ Create Team] [Import Teams]       │
│     ├──────────────────────────────────────┤
│     │ Teams: (empty)                       │
│     └──────────────────────────────────────┘
│
│  ├─ Click [+ Create Team]
│  │  │
│  │  └─ Modal: Create New Team
│  │     ┌──────────────────────────────────┐
│  │     │ Create New Team          [X]     │
│  │     ├──────────────────────────────────┤
│  │     │ Team Name: [Input]               │
│  │     │            "Engineering"        │
│  │     │                                  │
│  │     │ Description: [Optional]          │
│  │     │            "Dev & QA team"      │
│  │     │                                  │
│  │     │ [Create] [Cancel]                │
│  │     └──────────────────────────────────┘
│  │
│  │  └─ API creates team
│  │     ├─ Show success toast
│  │     └─ Add to list
│  │
│  └─ Repeat for each team
│     (e.g., Engineering, Finance, HR, etc.)

STEP 2: ADD USERS
│
├─ Click [User Management] in sidebar
│  │
│  └─ Navigate to /management/users
│     ┌──────────────────────────────────────┐
│     │ User Management                      │
│     ├──────────────────────────────────────┤
│     │ [+ Add User] [Bulk Import] [Export] │
│     ├──────────────────────────────────────┤
│     │ Users: (empty)                       │
│     └──────────────────────────────────────┘
│
│  ├─ Option A: Add Single User
│  │  │
│  │  ├─ Click [+ Add User]
│  │  │  │
│  │  │  └─ Modal: Create New User
│  │  │     ┌──────────────────────────────┐
│  │  │     │ Create New User       [X]    │
│  │  │     ├──────────────────────────────┤
│  │  │     │ Full Name: [Input]           │
│  │  │     │            "John Doe"       │
│  │  │     │                              │
│  │  │     │ Email: [Input]               │
│  │  │     │        "john@company.com"   │
│  │  │     │                              │
│  │  │     │ Role: [Select]               │
│  │  │     │       Employee ▼             │
│  │  │     │       (Employee/TL/DH/Admin)│
│  │  │     │                              │
│  │  │     │ Team: [Select]               │
│  │  │     │       Engineering ▼          │
│  │  │     │                              │
│  │  │     │ Password: [Auto-generated]   │
│  │  │     │ (Send via email)             │
│  │  │     │                              │
│  │  │     │ [Create] [Cancel]            │
│  │  │     └──────────────────────────────┘
│  │  │
│  │  └─ Success: User created
│  │     └─ Invitation email sent
│  │
│  │
│  └─ Option B: Bulk Import CSV
│     │
│     ├─ Click [Bulk Import]
│     │  │
│     │  └─ Modal: Import Users
│     │     ┌──────────────────────────────┐
│     │     │ Bulk Import Users      [X]   │
│     │     ├──────────────────────────────┤
│     │     │ CSV Format:                  │
│     │     │ name, email, role, team      │
│     │     │                              │
│     │     │ [Choose File...] users.csv   │
│     │     │                              │
│     │     │ Preview:                     │
│     │     │ - 20 users to import         │
│     │     │ - 2 conflicts (duplicate)    │
│     │     │                              │
│     │     │ [Import] [Cancel]            │
│     │     └──────────────────────────────┘
│     │
│     └─ Success: Users imported

STEP 3: ASSIGN TEAM LEADERS
│
├─ Go back to /management/teams
│  │
│  ├─ Click on team (e.g., "Engineering")
│  │  │
│  │  └─ Modal: Edit Team
│  │     ┌──────────────────────────────────┐
│  │     │ Edit Team: Engineering    [X]    │
│  │     ├──────────────────────────────────┤
│  │     │ Team Name: Engineering           │
│  │     │ Description: Dev & QA team       │
│  │     │                                  │
│  │     │ Team Leader: [Select]            │
│  │     │              John Doe ▼          │
│  │     │              (dropdown of users) │
│  │     │                                  │
│  │     │ Members: [Multi-select]          │
│  │     │ ☑ John Doe (Leader)              │
│  │     │ ☑ Jane Smith                     │
│  │     │ ☑ Bob Johnson                    │
│  │     │ ☐ Alice Wilson                   │
│  │     │                                  │
│  │     │ [Save] [Cancel]                  │
│  │     └──────────────────────────────────┘
│  │
│  └─ Continue for other teams

STEP 4: VERIFY & TEST
│
├─ Navigate to /dashboard/admin
│  │
│  └─ Dashboard should show:
│     ├─ Total Users: 45 ✓
│     ├─ Total Teams: 5 ✓
│     ├─ System Status: ✅ Ready
│     └─ [System Configuration] (optional advanced setup)
│
└─ SETUP COMPLETE ✅
   System is ready for users to login and start reporting!
```

---

## Quick Reference Checklist

### Before Development Starts
- [ ] Design system finalized (colors, typography, spacing)
- [ ] Component library planned (shadcn/ui imports listed)
- [ ] API contracts documented (request/response formats)
- [ ] Authentication method decided (JWT, OAuth, etc.)
- [ ] Deployment platform selected (Vercel, Netlify, AWS, etc.)
- [ ] Database schema reviewed by frontend team
- [ ] Git workflow established
- [ ] Development environment setup documented

### Phase Completion Checklist
**Phase 1:** Auth & Foundation
- [ ] Authentication pages built
- [ ] Routing configured
- [ ] Layout components created
- [ ] Design system implemented
- [ ] API service layer set up

**Phase 2:** Employee Features
- [ ] Heatmap visualization working
- [ ] Log form functional
- [ ] Dashboard responsive
- [ ] React Query configured
- [ ] Zustand stores working

**Phase 3:** Team Features
- [ ] Team monitoring dashboard
- [ ] Member drill-down pages
- [ ] Report preview working
- [ ] Filters functional

**Phase 4:** Admin Features
- [ ] User management CRUD
- [ ] Team management CRUD
- [ ] Permissions working
- [ ] Department dashboard

**Phase 5:** Advanced Features
- [ ] Export (PDF/Excel) working
- [ ] Dark mode support (optional)
- [ ] Internationalization (optional)
- [ ] Advanced filtering

**Phase 6:** Testing & Optimization
- [ ] Component tests > 70% coverage
- [ ] E2E tests for critical flows
- [ ] Performance optimized (LCP < 2.5s)
- [ ] Accessibility audit passed (WCAG AA)
- [ ] Lighthouse score > 85

---

**Document Version:** 1.0  
**Status:** Architecture Reference Ready  
**Last Updated:** 2024