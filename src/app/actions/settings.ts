"use server"

import { getSettings as dbGetSettings, updateSettings as dbUpdateSettings } from "@/lib/db"

/**
 * Server action to get settings from the database.
 */
export async function getSettingsAction() {
    return dbGetSettings()
}

/**
 * Server action to update settings in the database.
 */
export async function updateSettingsAction(settings: {
    isLocal?: boolean
    localUrl?: string
    comfyUrl?: string
    model?: string
    provider?: string
    apiKey?: string
}) {
    return dbUpdateSettings(settings)
}
