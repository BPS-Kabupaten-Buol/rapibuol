# Teams Feature - Quick Reference Guide

## 📍 Location
- **URL**: `/teams`
- **Menu**: Sidebar → General → Teams
- **Icon**: Users2

## 🎯 Main Operations

### Create Team
1. Click **"Add Team"** button (top right)
2. Fill in form:
   - **Team Name** (required): 2-100 characters
   - **Description** (optional): Up to 500 characters
   - **Team Leader** (optional): Select from user list
3. Click **"Create Team"**
4. ✅ Team appears in table immediately

### Edit Team
1. Find team in table
2. Click **⋮** (three dots menu)
3. Select **"Edit Team"**
4. Update fields
5. Click **"Update Team"**
6. ✅ Changes saved immediately

### Delete Team
1. Find team in table
2. Click **⋮** (three dots menu)
3. Select **"Delete Team"**
4. Confirm in dialog
5. ✅ Team deleted (members removed too)

## 👥 Member Management

### View Members
- See member count in **"Members"** column
- Click any cell in team row to open members dialog

### Add Member
1. Open team members dialog
2. Click **"Add Member"** button
3. Select user from dropdown
   - Only shows users not already in team
4. Choose role:
   - **Member**: Basic team member
   - **Manager**: Can manage team tasks
   - **Admin**: Full team access
5. Click **"Add Member"**
6. ✅ Member added to list

### Remove Member
1. Open team members dialog
2. Find member in list
3. Click **🗑️** (trash icon) at end of row
4. ✅ Member removed immediately

### Change Member Role
- Currently role is assigned at add time
- To change: Remove member and re-add with new role

## 📊 Table Features

### Search/Filter
- Use search box to filter by team name
- Type to search (e.g., "engineering")
- Real-time filtering

### Sort
- Click column headers to sort
- Click again to reverse sort
- Sorted columns show indicator

### Pagination
- Shows 10 teams per page
- Use pagination controls at bottom
- Jump to specific page

### View Columns
- Click column visibility icon to toggle columns
- Select/deselect columns to display

## 🔍 What You See

### Teams Table Columns
| Column | Shows |
|--------|-------|
| Team Name | Team name with icon |
| Team Leader | Leader's name and email (if assigned) |
| Description | Team description (truncated) |
| Members | Number of team members |
| Created | Date team was created |
| Actions | Edit/Delete menu |

### Member Dialog Shows
| Column | Shows |
|--------|-------|
| Name | User's full name |
| Email | User's email address |
| Role | member/manager/admin badge |
| Joined | Date user joined team |
| Actions | Remove button |

## ⚙️ Form Validation

### Team Name
- ✅ Required (cannot be empty)
- ✅ Minimum 2 characters
- ❌ Maximum 100 characters

### Description
- ✅ Optional
- ❌ Maximum 500 characters

### Team Leader
- ✅ Optional (can be unassigned)
- ✅ Must be valid user UUID

### Member Role
- ✅ Required when adding member
- ✅ Options: member, manager, admin

## 💬 Messages & Feedback

### Success Notifications
- "Team created successfully!"
- "Team updated successfully!"
- "Team deleted successfully!"
- "Member added successfully!"
- "Member removed from team"

### Error Messages
- "Team name must be at least 2 characters"
- "Please select a valid team leader"
- "User is already a member of this team"
- "Failed to add member" (with reason)

### Loading States
- "Loading teams..." (table)
- "Loading members..." (members dialog)
- "Creating..." / "Updating..." / "Deleting..." (buttons)

## 🎨 Visual Indicators

### Member Count Badge
- Shows number + "members" or "member"
- Example: "5 members"

### Role Badges (Members Dialog)
- **Member**: Gray outline badge
- **Manager**: Blue secondary badge
- **Admin**: Blue solid badge

### Status Icons
- ✅ Success: Check mark in notification
- ❌ Error: X mark in notification
- ⏳ Loading: Spinner on button

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Navigate form fields |
| Enter | Submit form / Open row menu |
| Escape | Close dialog |
| Space | Check/uncheck row selection |

## 🔐 Permissions

### Who Can...
- **Create Teams**: Authenticated users
- **Edit Teams**: Team creator/admin
- **Delete Teams**: Team creator/admin
- **Add Members**: Team manager/admin
- **Remove Members**: Team manager/admin
- **Change Roles**: Team admin only

## 🚨 Important Notes

### What Happens When...
- **Delete Team**: All team members are removed too
- **Remove Member**: User stays in system, just removed from team
- **Change Leader**: Old leader not automatically removed as member
- **Add Duplicate**: System prevents adding same user twice

### Data is Saved When...
- ✅ After clicking "Create Team"
- ✅ After clicking "Update Team"
- ✅ After clicking "Delete" (confirmed)
- ✅ After clicking "Add Member"
- ✅ After clicking remove member trash icon

### No Manual Save Needed
- All operations auto-save
- No "Save" button required
- Refreshing page reloads data

## 🐛 Common Issues

**Teams not showing?**
- Check you're logged in
- Refresh page (F5)
- Check browser console for errors

**Can't add member?**
- Verify user exists in system
- Check user not already in team
- Try refreshing and try again

**Dialog won't open?**
- Try refreshing page
- Check browser console
- Close and reopen Teams page

**Form validation error?**
- Check team name is 2-100 chars
- Check description is under 500 chars
- Ensure leader is valid user

## 📱 Mobile Usage

### Mobile Optimizations
- ✅ Responsive table layout
- ✅ Scrollable on narrow screens
- ✅ Touch-friendly buttons
- ✅ Mobile-sized dialogs

### Mobile Tips
- Use landscape mode for better table view
- Swipe dialogs to close
- Tap menu ⋮ for team actions
- Use scroll to see all columns

## 🌓 Dark Mode

### Works In Both Modes
- ✅ All components support dark mode
- ✅ Switch theme from top menu
- ✅ Settings persists across sessions

## 🔗 Related Features

### Connected To
- **Users**: Team leaders and members are users
- **Tasks**: Teams can own tasks
- **Dashboard**: Can show team stats

### Integration Points
- Filter tasks by team
- Assign tasks to team members
- View team statistics on dashboard

## 📚 Need More Help?

See full documentation:
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Architecture
- [TEAMS_FEATURE_IMPLEMENTATION.md](./TEAMS_FEATURE_IMPLEMENTATION.md) - Technical details
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) - Troubleshooting

---

**Last Updated**: 2024
**Feature**: Teams Management v1.0