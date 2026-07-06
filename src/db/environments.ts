/**
 * Environments — deployment targets with platform version and governance rules.
 */

import { isConnected } from './api-config'

export interface Environment {
  id: number
  name: string
  platformVersion: string
  approvalRequired: boolean
  separationOfDuties: boolean
  designatedApprover: string | null
  isReachable: boolean
}

const mockEnvironments: Environment[] = [
  { id: 1, name: 'Staging', platformVersion: '24.3', approvalRequired: false, separationOfDuties: false, designatedApprover: null, isReachable: true },
  { id: 2, name: 'UAT', platformVersion: '24.3', approvalRequired: true, separationOfDuties: false, designatedApprover: 'manager.jones', isReachable: true },
  { id: 3, name: 'Pre-Prod', platformVersion: '24.2', approvalRequired: true, separationOfDuties: false, designatedApprover: 'manager.jones', isReachable: true },
  { id: 4, name: 'Production', platformVersion: '24.2', approvalRequired: true, separationOfDuties: true, designatedApprover: 'director.smith', isReachable: true },
]

export async function getEnvironments(): Promise<Environment[]> {
  if (!isConnected()) return [...mockEnvironments]
  return [...mockEnvironments]
}

export async function getEnvironment(name: string): Promise<Environment | undefined> {
  const all = await getEnvironments()
  return all.find(e => e.name === name)
}
