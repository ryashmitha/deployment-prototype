/**
 * Releases — named groupings of packages for coordinated deployment.
 */

import { isConnected } from './api-config'

export interface Release {
  id: number
  name: string
  targetDate: string | null
  status: 'active' | 'deployed' | 'archived'
  createdBy: string
  createdOn: string
}

const mockReleases: Release[] = [
  { id: 1, name: 'Sprint 24.3', targetDate: '2026-07-15', status: 'active', createdBy: 'alice.chen', createdOn: '2026-07-01' },
  { id: 2, name: 'Sprint 24.4', targetDate: '2026-07-29', status: 'active', createdBy: 'alice.chen', createdOn: '2026-07-01' },
]

export async function getReleases(): Promise<Release[]> {
  if (!isConnected()) return [...mockReleases]
  return [...mockReleases]
}

export async function getActiveReleases(): Promise<Release[]> {
  const all = await getReleases()
  return all.filter(r => r.status === 'active')
}

export async function createRelease(data: Omit<Release, 'id'>): Promise<Release> {
  const newRelease: Release = { ...data, id: Math.max(0, ...mockReleases.map(r => r.id)) + 1 }
  mockReleases.push(newRelease)
  return newRelease
}
