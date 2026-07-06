/**
 * Stories — user stories on the deployment kanban board.
 * Each story has design objects, a release, and deployment state.
 */

import { isConnected } from './api-config'

export type BuildStatus = 'not-started' | 'in-progress' | 'completed' | 'failed' | 'interrupted'
export type ValidationStatus = 'not-started' | 'pending' | 'running' | 'passed' | 'failed'

export interface DesignObject {
  id: number
  name: string
  type: 'interface' | 'expression-rule' | 'record-type' | 'process-model' | 'constant'
  purposeSummary: string
  status: 'pending' | 'building' | 'completed' | 'failed'
}

export interface Story {
  id: number
  storyId: string
  title: string
  description: string
  listId: number
  releaseId: number | null
  designObjects: DesignObject[]
  buildStatus: BuildStatus
  validationStatus: ValidationStatus
  packageCreated: boolean
  deployedEnvironment: string | null
  createdBy: string
  createdOn: string
}

const mockStories: Story[] = [
  {
    id: 1, storyId: 'US-001', title: 'Create Employee Onboarding Interface', description: 'Build the main onboarding form with personal info fields.',
    listId: 5, releaseId: 1, buildStatus: 'completed', validationStatus: 'passed', packageCreated: true, deployedEnvironment: 'Staging',
    designObjects: [
      { id: 1, name: 'CDT_Employee', type: 'record-type', purposeSummary: 'Employee data structure', status: 'completed' },
      { id: 2, name: 'CDT_EmployeeAddress', type: 'record-type', purposeSummary: 'Address sub-record for employees', status: 'completed' },
      { id: 3, name: 'CDT_EmergencyContact', type: 'record-type', purposeSummary: 'Emergency contact info', status: 'completed' },
      { id: 4, name: 'EX_GetEmployeeById', type: 'expression-rule', purposeSummary: 'Fetch employee by ID', status: 'completed' },
      { id: 5, name: 'EX_GetAllEmployees', type: 'expression-rule', purposeSummary: 'Query all employees with filters', status: 'completed' },
      { id: 6, name: 'EX_ValidateEmployeeData', type: 'expression-rule', purposeSummary: 'Validate required fields', status: 'completed' },
      { id: 7, name: 'EX_FormatEmployeeName', type: 'expression-rule', purposeSummary: 'Format display name from first/last', status: 'completed' },
      { id: 8, name: 'EX_CalculateStartDate', type: 'expression-rule', purposeSummary: 'Compute start date from offer acceptance', status: 'completed' },
      { id: 9, name: 'INT_EmployeeOnboarding', type: 'interface', purposeSummary: 'Main onboarding form UI', status: 'completed' },
      { id: 10, name: 'INT_PersonalInfoSection', type: 'interface', purposeSummary: 'Personal details section', status: 'completed' },
      { id: 11, name: 'INT_AddressSection', type: 'interface', purposeSummary: 'Address input section', status: 'completed' },
      { id: 12, name: 'INT_EmergencyContactSection', type: 'interface', purposeSummary: 'Emergency contact section', status: 'completed' },
      { id: 13, name: 'PM_OnboardingSubmission', type: 'process-model', purposeSummary: 'Process to submit onboarding form', status: 'completed' },
      { id: 14, name: 'CON_EMPLOYEE_STATUS_OPTIONS', type: 'constant', purposeSummary: 'Status enum values', status: 'completed' },
      { id: 15, name: 'CON_DEPARTMENT_LIST', type: 'constant', purposeSummary: 'Department dropdown options', status: 'completed' },
    ],
    createdBy: 'alice.chen', createdOn: '2026-07-01',
  },
  {
    id: 2, storyId: 'US-002', title: 'Build Manager Approval Workflow', description: 'Process model for manager review and approval of new hires.',
    listId: 4, releaseId: 1, buildStatus: 'completed', validationStatus: 'not-started', packageCreated: false, deployedEnvironment: null,
    designObjects: [
      { id: 16, name: 'PM_ManagerApproval', type: 'process-model', purposeSummary: 'Main approval workflow', status: 'completed' },
      { id: 17, name: 'PM_EscalationProcess', type: 'process-model', purposeSummary: 'Escalation if no response in 48h', status: 'completed' },
      { id: 18, name: 'PM_RejectionHandler', type: 'process-model', purposeSummary: 'Handle rejection and notify HR', status: 'completed' },
      { id: 19, name: 'INT_ApprovalForm', type: 'interface', purposeSummary: 'Approval decision form', status: 'completed' },
      { id: 20, name: 'INT_ApprovalHistory', type: 'interface', purposeSummary: 'View past approvals', status: 'completed' },
      { id: 21, name: 'INT_EscalationNotice', type: 'interface', purposeSummary: 'Escalation alert UI', status: 'completed' },
      { id: 22, name: 'EX_GetPendingApprovals', type: 'expression-rule', purposeSummary: 'Query pending approval items', status: 'completed' },
      { id: 23, name: 'EX_ValidateApproval', type: 'expression-rule', purposeSummary: 'Check approval preconditions', status: 'completed' },
      { id: 24, name: 'EX_FormatApproverName', type: 'expression-rule', purposeSummary: 'Format manager display name', status: 'completed' },
      { id: 25, name: 'EX_CheckEscalationThreshold', type: 'expression-rule', purposeSummary: 'Determine if escalation needed', status: 'completed' },
      { id: 26, name: 'EX_GetApprovalChain', type: 'expression-rule', purposeSummary: 'Retrieve approval hierarchy', status: 'completed' },
      { id: 27, name: 'CDT_ApprovalDecision', type: 'record-type', purposeSummary: 'Approval decision record', status: 'completed' },
      { id: 28, name: 'CON_APPROVAL_STATUS', type: 'constant', purposeSummary: 'Approval status enum values', status: 'completed' },
      { id: 29, name: 'CON_ESCALATION_HOURS', type: 'constant', purposeSummary: 'Hours before escalation triggers', status: 'completed' },
    ],
    createdBy: 'bob.martinez', createdOn: '2026-07-02',
  },
  {
    id: 3, storyId: 'US-003', title: 'Implement Document Upload Component', description: 'Allow new hires to upload required documents during onboarding.',
    listId: 4, releaseId: 1, buildStatus: 'completed', validationStatus: 'not-started', packageCreated: false, deployedEnvironment: null,
    designObjects: [
      { id: 30, name: 'INT_DocumentUpload', type: 'interface', purposeSummary: 'File upload UI component', status: 'completed' },
      { id: 31, name: 'INT_DocumentList', type: 'interface', purposeSummary: 'List of uploaded documents', status: 'completed' },
      { id: 32, name: 'INT_DocumentPreview', type: 'interface', purposeSummary: 'Document preview modal', status: 'completed' },
      { id: 33, name: 'EX_ValidateFileType', type: 'expression-rule', purposeSummary: 'Check allowed file extensions', status: 'completed' },
      { id: 34, name: 'EX_ValidateFileSize', type: 'expression-rule', purposeSummary: 'Enforce max file size limit', status: 'completed' },
      { id: 35, name: 'EX_GetDocumentsByEmployee', type: 'expression-rule', purposeSummary: 'Fetch docs for an employee', status: 'completed' },
      { id: 36, name: 'EX_GenerateDocumentName', type: 'expression-rule', purposeSummary: 'Auto-generate doc filename', status: 'completed' },
      { id: 37, name: 'EX_CheckRequiredDocuments', type: 'expression-rule', purposeSummary: 'Verify all required docs uploaded', status: 'completed' },
      { id: 38, name: 'CDT_Document', type: 'record-type', purposeSummary: 'Document metadata record', status: 'completed' },
      { id: 39, name: 'CDT_DocumentCategory', type: 'record-type', purposeSummary: 'Document category lookup', status: 'completed' },
      { id: 40, name: 'PM_DocumentProcessing', type: 'process-model', purposeSummary: 'Process uploaded docs', status: 'completed' },
      { id: 41, name: 'CON_ALLOWED_FILE_TYPES', type: 'constant', purposeSummary: 'Permitted file extensions', status: 'completed' },
      { id: 42, name: 'CON_MAX_FILE_SIZE_MB', type: 'constant', purposeSummary: 'Maximum upload size', status: 'completed' },
      { id: 43, name: 'CON_REQUIRED_DOC_TYPES', type: 'constant', purposeSummary: 'Required document categories', status: 'completed' },
    ],
    createdBy: 'carol.white', createdOn: '2026-07-03',
  },
  {
    id: 4, storyId: 'US-004', title: 'Create Notification Rules', description: 'Expression rules for email and in-app notifications throughout the onboarding flow.',
    listId: 4, releaseId: 1, buildStatus: 'completed', validationStatus: 'not-started', packageCreated: false, deployedEnvironment: null,
    designObjects: [
      { id: 44, name: 'EX_SendEmailNotification', type: 'expression-rule', purposeSummary: 'Trigger email via SMTP', status: 'completed' },
      { id: 45, name: 'EX_SendInAppNotification', type: 'expression-rule', purposeSummary: 'Push in-app notification', status: 'completed' },
      { id: 46, name: 'EX_BuildEmailBody', type: 'expression-rule', purposeSummary: 'Construct email HTML body', status: 'completed' },
      { id: 47, name: 'EX_GetNotificationRecipients', type: 'expression-rule', purposeSummary: 'Resolve recipient list', status: 'completed' },
      { id: 48, name: 'EX_CheckNotificationPreferences', type: 'expression-rule', purposeSummary: 'Check user preferences', status: 'completed' },
      { id: 49, name: 'EX_FormatNotificationDate', type: 'expression-rule', purposeSummary: 'Format dates for display', status: 'completed' },
      { id: 50, name: 'EX_GetUnreadNotifications', type: 'expression-rule', purposeSummary: 'Query unread notification count', status: 'completed' },
      { id: 51, name: 'EX_MarkNotificationRead', type: 'expression-rule', purposeSummary: 'Mark notification as read', status: 'completed' },
      { id: 52, name: 'INT_NotificationCenter', type: 'interface', purposeSummary: 'Notification bell dropdown UI', status: 'completed' },
      { id: 53, name: 'INT_NotificationSettings', type: 'interface', purposeSummary: 'User notification preferences', status: 'completed' },
      { id: 54, name: 'CDT_Notification', type: 'record-type', purposeSummary: 'Notification record', status: 'completed' },
      { id: 55, name: 'CDT_NotificationTemplate', type: 'record-type', purposeSummary: 'Email/notification templates', status: 'completed' },
      { id: 56, name: 'PM_NotificationDispatcher', type: 'process-model', purposeSummary: 'Route notifications to channels', status: 'completed' },
      { id: 57, name: 'CON_NOTIFICATION_TEMPLATES', type: 'constant', purposeSummary: 'Template string IDs', status: 'completed' },
      { id: 58, name: 'CON_NOTIFICATION_CHANNELS', type: 'constant', purposeSummary: 'Available notification channels', status: 'completed' },
      { id: 59, name: 'CON_MAX_RETRY_ATTEMPTS', type: 'constant', purposeSummary: 'Max delivery retry count', status: 'completed' },
    ],
    createdBy: 'david.kim', createdOn: '2026-07-04',
  },
  {
    id: 5, storyId: 'US-005', title: 'Build Reporting Dashboard', description: 'Dashboard showing onboarding metrics and completion rates.',
    listId: 1, releaseId: 1, buildStatus: 'not-started', validationStatus: 'not-started', packageCreated: false, deployedEnvironment: null,
    designObjects: [],
    createdBy: 'alice.chen', createdOn: '2026-07-05',
  },
  {
    id: 6, storyId: 'US-006', title: 'Add Role-Based Access Rules', description: 'Security expression rules for role-based visibility.',
    listId: 1, releaseId: 2, buildStatus: 'not-started', validationStatus: 'not-started', packageCreated: false, deployedEnvironment: null,
    designObjects: [],
    createdBy: 'bob.martinez', createdOn: '2026-07-05',
  },
]

export async function getStories(): Promise<Story[]> {
  if (!isConnected()) return [...mockStories]
  return [...mockStories]
}

export async function updateStory(id: number, data: Partial<Story>): Promise<Story | undefined> {
  const idx = mockStories.findIndex(s => s.id === id)
  if (idx === -1) return undefined
  mockStories[idx] = { ...mockStories[idx], ...data }
  return mockStories[idx]
}
