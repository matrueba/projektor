import { getLocalUser, User } from '@/lib/db'

/**
 * Simple local auth - always returns the local user
 * No actual authentication needed for local-only app
 */
export function getCurrentUser(): User {
    return getLocalUser()
}

/**
 * Check if user is authenticated
 * In local mode, always returns true
 */
export function isAuthenticated(): boolean {
    return true
}
