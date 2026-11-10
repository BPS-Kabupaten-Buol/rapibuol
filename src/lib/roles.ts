/**
 * Role IDs from the `roles` table.
 * 1 = admin, 2 = kepala satker.
 */
export const ROLE_ADMIN = 1
export const ROLE_KEPALA_SATKER = 2

/** Roles allowed into team management. */
export const TEAM_MANAGEMENT_ROLES = [ROLE_ADMIN, ROLE_KEPALA_SATKER]

/** Roles allowed into user management. */
export const USER_MANAGEMENT_ROLES = [ROLE_ADMIN]

/** Roles that may see the satker (organisation wide) dashboard. */
export const SATKER_DASHBOARD_ROLES = [ROLE_ADMIN, ROLE_KEPALA_SATKER]
