import { useState, useEffect, useRef } from 'react'
import {
  ApplicationHeader,
  HeadingField,
  ButtonWidget,
  ButtonArrayLayout,
  TextField,
  DialogField,
  DropdownField,
  RichTextDisplayField,
  TextItem,
  MessageBanner,
} from '@pglevy/sailwind'
import { getStories, type Story, type ValidationStatus } from '../db/stories'
import { getReleases, createRelease, type Release } from '../db/releases'
import { getEnvironments, type Environment } from '../db/environments'
import { Clock, CheckCircle, XCircle, Send, RefreshCw, Sparkles } from 'lucide-react'

// Chat message types
type ChatMessageType = 'build-progress' | 'validation-result' | 'conflict-resolution' | 'deployment-progress' | 'deployment-result' | 'approval-request' | 'error' | 'info' | 'user-action'

interface ChatMessage {
  id: number
  type: ChatMessageType
  sender: 'agent' | 'user' | 'system'
  content: string
  timestamp: string
  actions?: { label: string; value: string; style: 'PRIMARY' | 'SECONDARY' | 'NEGATIVE' }[]
}

// Board columns
const COLUMNS = [
  { id: 1, name: 'To Do' },
  { id: 2, name: 'In Progress' },
  { id: 3, name: 'Code Review' },
  { id: 4, name: 'Verification & Validation' },
  { id: 5, name: 'Done' },
]

export default function DeploymentBoard() {
  const [stories, setStories] = useState<Story[]>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatOpen, setChatOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'board' | 'all-objects' | 'plug-ins' | 'unreferenced'>('board')
  const [activeView, setActiveView] = useState<'build' | 'packages' | 'package-detail'>('build')
  const [detailPkgStory, setDetailPkgStory] = useState<Story | null>(null)
  const [pkgFilterName, setPkgFilterName] = useState('')
  const [pkgFilterRelease, setPkgFilterRelease] = useState<string | number>('__all__')
  const [pkgFilterObject, setPkgFilterObject] = useState('')
  const [pkgFilterModifiedBy, setPkgFilterModifiedBy] = useState<string>('__all__')
  const [pkgFilterLastMod, setPkgFilterLastMod] = useState<string>('last-month')
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [showReleaseModal, setShowReleaseModal] = useState(false)
  const [showComposerPrompt, setShowComposerPrompt] = useState(false)
  const [showDeployDialog, setShowDeployDialog] = useState(false)
  const [showStoryDetail, setShowStoryDetail] = useState(false)
  const [showCreatePackage, setShowCreatePackage] = useState(false)
  const [showEditPackage, setShowEditPackage] = useState(false)
  const [editPkgStory, setEditPkgStory] = useState<Story | null>(null)
  const [editPkgName, setEditPkgName] = useState('')
  const [editPkgTicket, setEditPkgTicket] = useState('')
  const [editPkgDescription, setEditPkgDescription] = useState('')
  const [editPkgRelease, setEditPkgRelease] = useState<string | number>('')
  const [newPkgName, setNewPkgName] = useState('')
  const [newPkgTicket, setNewPkgTicket] = useState('')
  const [newPkgDescription, setNewPkgDescription] = useState('')
  const [newPkgRelease, setNewPkgRelease] = useState<string | number>('')
  const [showManageReleases, setShowManageReleases] = useState(false)
  const [editingRelease, setEditingRelease] = useState<Release | null>(null)
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null)
  const [deployTarget, setDeployTarget] = useState<string>('Staging')
  const [newReleaseName, setNewReleaseName] = useState('')
  const [newReleaseDate, setNewReleaseDate] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)
  const [isBuildingObjects, setIsBuildingObjects] = useState(false)
  const [progressLabel, setProgressLabel] = useState('Generating objects')
  const [isThinking, setIsThinking] = useState(false)
  const [draggedStoryId, setDraggedStoryId] = useState<number | null>(null)
  const [dragOverColId, setDragOverColId] = useState<number | null>(null)
  const [deployProgress, setDeployProgress] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const nextMsgId = useRef(1)

  useEffect(() => {
    Promise.all([getStories(), getReleases(), getEnvironments()]).then(([s, r, e]) => {
      setStories(s)
      setReleases(r)
      setEnvironments(e)
      // Default to first active release
      const firstActive = r.find((rel: Release) => rel.status === 'active')
      if (firstActive) setSelectedReleaseId(firstActive.id)
    })
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isThinking, isDeploying, isBuildingObjects, deployProgress])

  const addMessage = (type: ChatMessageType, sender: 'agent' | 'user' | 'system', content: string, actions?: ChatMessage['actions']) => {
    setChatMessages(prev => [...prev, {
      id: nextMsgId.current++,
      type, sender, content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions,
    }])
  }

  const storiesForColumn = (colId: number) => stories.filter(s => s.listId === colId && (selectedReleaseId === null || s.releaseId === selectedReleaseId))
  const getReleaseName = (releaseId: number | null) => releases.find(r => r.id === releaseId)?.name ?? 'Unassigned'

  const truncateTitle = (title: string) => title.length > 120 ? title.slice(0, 120) + '…' : title

  const getFilteredPackages = () => {
    return stories.filter(s => {
      // Must have package created
      if (!s.packageCreated) return false
      // Name/Description filter
      if (pkgFilterName && !s.title.toLowerCase().includes(pkgFilterName.toLowerCase()) && !s.description.toLowerCase().includes(pkgFilterName.toLowerCase())) return false
      // Release filter
      if (pkgFilterRelease !== '__all__' && s.releaseId !== pkgFilterRelease) return false
      // Object filter
      if (pkgFilterObject && !s.designObjects.some(o => o.name.toLowerCase().includes(pkgFilterObject.toLowerCase()))) return false
      // Modified By filter
      if (pkgFilterModifiedBy !== '__all__' && s.createdBy !== pkgFilterModifiedBy) return false
      return true
    })
  }

  const getValidationLabel = (status: ValidationStatus): string => {
    switch (status) {
      case 'passed': return 'Validated'
      case 'failed': return 'Issues Found'
      case 'running': return 'Validating…'
      case 'pending': return 'Pending'
      default: return ''
    }
  }

  // --- Composer: Release creation flow ---
  const handleCreateRelease = async () => {
    if (!newReleaseName.trim()) return
    const release = await createRelease({
      name: newReleaseName.trim(),
      targetDate: newReleaseDate || null,
      status: 'active',
      createdBy: 'alice.chen',
      createdOn: new Date().toISOString().split('T')[0],
    })
    setReleases(prev => [...prev, release])
    // Assign release to all unassigned stories
    const updated = stories.map(s => s.releaseId ? s : { ...s, releaseId: release.id })
    setStories(updated)
    setSelectedReleaseId(release.id)
    addMessage('info', 'system', `Release "${release.name}" created and assigned to all unassigned stories.`)
    setNewReleaseName('')
    setNewReleaseDate('')
    setShowComposerPrompt(false)
  }

  // --- Release override ---
  const handleReleaseOverride = async (storyId: number, newReleaseId: number) => {
    const story = stories.find(s => s.id === storyId)
    if (!story) return
    const newRelease = releases.find(r => r.id === newReleaseId)
    if (story.deployedEnvironment) {
      addMessage('info', 'agent', `⚠️ Story ${story.storyId} has already been deployed to ${story.deployedEnvironment}. The deployed package will remain in the original release on that environment.`)
    }
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, releaseId: newReleaseId } : s))
    addMessage('info', 'agent', `Release for ${story.storyId} changed to "${newRelease?.name}".`)
    setShowReleaseModal(false)
  }

  // --- Validation simulation with rich issue types ---
  const handleRunValidation = async (story: Story) => {
    setChatOpen(true)
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, validationStatus: 'running' as ValidationStatus } : s))

    // Step 1: Package creation with progress bar
    addMessage('build-progress', 'agent', `📦 Creating package for ${story.storyId} "${story.title}"…\nAdding ${story.designObjects.length} objects. Release: ${getReleaseName(story.releaseId)}.`)
    setProgressLabel('Creating package')
    setIsBuildingObjects(true)
    setDeployProgress(0)

    // Simulate progress for package creation
    const totalSteps = story.designObjects.length
    for (let i = 0; i < totalSteps; i++) {
      await new Promise(r => setTimeout(r, 150))
      setDeployProgress(Math.round(((i + 1) / totalSteps) * 100))
    }

    setIsBuildingObjects(false)
    setDeployProgress(100)
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, packageCreated: true } : s))
    addMessage('info', 'agent', `📦 Package created — ${story.designObjects.length} objects added.\n\nRunning validation checks now…`)

    // Step 2: Validation checks (staggered)
    setIsThinking(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsThinking(false)

    // Each story triggers different validation issues for demo purposes
    if (story.storyId === 'US-003') {
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, validationStatus: 'failed' as ValidationStatus } : s))
      addMessage('conflict-resolution', 'agent', `Heads up — I found a dependency issue with ${story.storyId} "${story.title}".\n\nIt references "DOCUMENT_RECORD" record type, but that doesn't exist on Staging yet. It's part of US-005 "Build Reporting Dashboard" which hasn't been deployed.\n\nHere's what we can do:\n• Add DOCUMENT_RECORD to this package directly\n• Deploy US-005 first (it has what we need)\n• Remove the reference from the interface\n\nWhat works best for you?`, [
        { label: 'Add to package', value: 'add-precedent', style: 'PRIMARY' },
        { label: 'Deploy US-005 first', value: 'deploy-dependency-first', style: 'SECONDARY' },
        { label: 'Remove reference', value: 'remove-reference', style: 'SECONDARY' },
      ])
    } else if (story.storyId === 'US-002') {
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, validationStatus: 'failed' as ValidationStatus } : s))
      addMessage('conflict-resolution', 'agent', `I found a conflict with ${story.storyId} "${story.title}".\n\n"APPROVAL_STATUS" constant is also being modified by alice.chen in US-001's package.\n\nYour value: "PENDING_APPROVAL"\nTheirs: "SUBMITTED"\n\nIf both deploy, the last one wins. Here's what we can do:\n• Deploy yours first (your value sticks until they deploy)\n• Remove it from your package (use their value)\n• Deploy with the overlap (you decide later)\n\nWhat would you like to do?`, [
        { label: 'Deploy with overlap', value: 'deploy-overlap', style: 'SECONDARY' },
        { label: 'Remove from package', value: 'exclude', style: 'SECONDARY' },
        { label: 'Deploy mine first', value: 'deploy-mine-first', style: 'PRIMARY' },
      ])
      await new Promise(r => setTimeout(r, 500))
      addMessage('conflict-resolution', 'agent', `Also — 2 of 3 expression rule tests didn't pass:\n\n❌ EX_GetPendingApprovals — expected empty list, got null\n❌ EX_ValidateApproval — expected true, got error\n✅ EX_FormatApproverName — passed\n\nDeploy is blocked until these are fixed. Want me to help debug, or skip tests?`, [
        { label: 'Help me debug', value: 'debug-tests', style: 'PRIMARY' },
        { label: 'Skip tests (force)', value: 'skip-tests', style: 'NEGATIVE' },
        { label: 'Re-run tests', value: 'revalidate', style: 'SECONDARY' },
      ])
    } else if (story.storyId === 'US-004') {
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, validationStatus: 'failed' as ValidationStatus } : s))
      addMessage('conflict-resolution', 'agent', `Found a cross-release dependency on ${story.storyId} "${story.title}".\n\nIt needs "NOTIFICATION_TEMPLATE" record type, which lives in US-006's package.\n\nProblem: ${story.storyId} is in Sprint 24.3 (Jul 15) but US-006 is in Sprint 24.4 (Jul 29). If 24.3 deploys without US-006, this story will break.\n\nOptions:\n• Move US-006 to Sprint 24.3 (bring the dependency forward)\n• Move ${story.storyId} to Sprint 24.4 (deploy together)\n• Include NOTIFICATION_TEMPLATE directly in this package\n\nWhich works best?`, [
        { label: 'Move US-006 forward', value: 'move-dep-forward', style: 'PRIMARY' },
        { label: 'Move US-004 back', value: 'move-story-back', style: 'SECONDARY' },
        { label: 'Include in package', value: 'include-in-package', style: 'SECONDARY' },
      ])
    } else if (story.storyId === 'US-001') {
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, validationStatus: 'failed' as ValidationStatus } : s))
      addMessage('conflict-resolution', 'agent', `Quick note on ${story.storyId} "${story.title}" — there's a version mismatch.\n\nDev is on v24.3 but Pre-Prod is still on v24.2. Compare and Deploy won't work across versions.\n\nI can switch to export/import automatically — it works fine, you just won't get guided inspection on the other side.\n\nOptions:\n• Proceed with export/import (I'll handle it)\n• Wait for Pre-Prod to upgrade to v24.3\n• Pick a different environment that matches\n\nShould I go ahead with export/import?`, [
        { label: 'Proceed with export/import', value: 'use-export-import', style: 'PRIMARY' },
        { label: 'Wait for upgrade', value: 'wait-upgrade', style: 'SECONDARY' },
        { label: 'Choose different env', value: 'different-env', style: 'SECONDARY' },
      ])
    } else {
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
      addMessage('validation-result', 'agent', `All clear ✅ No conflicts, no missing pieces. ${story.storyId} is ready to deploy whenever you are.\n\n✅ Expression tests passed\n✅ No missing precedents\n✅ No release overlaps\n✅ Dependencies resolved\n✅ Deploy order clear`)
    }
  }

  // --- Auto-build when story moves to In Progress ---
  const handleAutoBuild = async (story: Story) => {
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, buildStatus: 'in-progress' } : s))
    setChatOpen(true)
    setProgressLabel('Generating objects')
    setIsBuildingObjects(true)
    setDeployProgress(0)
    addMessage('build-progress', 'agent', `On it — building ${story.storyId} "${story.title}" now…\nGenerating 15 design objects.`)

    const sid = story.storyId.replace('-', '')
    const objectTemplates: Array<{ name: string; type: 'interface' | 'expression-rule' | 'record-type' | 'process-model' | 'constant'; purposeSummary: string }> = [
      { name: `CDT_${sid}`, type: 'record-type', purposeSummary: `Primary data model for ${story.title}` },
      { name: `CDT_${sid}_Detail`, type: 'record-type', purposeSummary: `Detail sub-record for ${story.title}` },
      { name: `EX_Get${sid}ById`, type: 'expression-rule', purposeSummary: `Fetch record by ID` },
      { name: `EX_GetAll${sid}`, type: 'expression-rule', purposeSummary: `Query all records with filters` },
      { name: `EX_Validate${sid}`, type: 'expression-rule', purposeSummary: `Validate required fields` },
      { name: `EX_Format${sid}Display`, type: 'expression-rule', purposeSummary: `Format display values` },
      { name: `EX_Calculate${sid}Status`, type: 'expression-rule', purposeSummary: `Compute status from rules` },
      { name: `EX_Check${sid}Permissions`, type: 'expression-rule', purposeSummary: `Verify user access` },
      { name: `INT_${sid}_Main`, type: 'interface', purposeSummary: `Main interface for ${story.title}` },
      { name: `INT_${sid}_Form`, type: 'interface', purposeSummary: `Input form interface` },
      { name: `INT_${sid}_Summary`, type: 'interface', purposeSummary: `Summary/read-only view` },
      { name: `PM_${sid}_Submit`, type: 'process-model', purposeSummary: `Submission workflow` },
      { name: `PM_${sid}_Update`, type: 'process-model', purposeSummary: `Update/edit workflow` },
      { name: `CON_${sid}_STATUS_OPTIONS`, type: 'constant', purposeSummary: `Status enum values` },
      { name: `CON_${sid}_CONFIG`, type: 'constant', purposeSummary: `Configuration constants` },
    ]

    const generatedObjects: typeof story.designObjects = []
    for (let i = 0; i < objectTemplates.length; i++) {
      await new Promise(r => setTimeout(r, 300))
      const obj = objectTemplates[i]
      generatedObjects.push({ id: Date.now() + i, ...obj, status: 'completed' as const })
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, designObjects: [...generatedObjects] } : s))
      setDeployProgress(Math.round(((i + 1) / objectTemplates.length) * 100))
    }

    setIsBuildingObjects(false)
    setDeployProgress(100)
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, buildStatus: 'completed', listId: 3 } : s))
    addMessage('build-progress', 'agent', `Done ✅ ${generatedObjects.length} objects created for ${story.storyId}. Moved to Code Review — take a look and let me know if it's good.`)
  }

  // --- Deployment flow ---
  const handleDeploy = async (story: Story) => {
    const env = environments.find(e => e.name === deployTarget)
    if (!env) return

    setShowDeployDialog(false)
    setChatOpen(true)

    const sourceVersion = '24.3'
    const versionMatch = sourceVersion === env.platformVersion
    const objCount = story.designObjects.length
    const newCount = Math.ceil(objCount * 0.6)
    const modCount = objCount - newCount
    const exprRuleCount = story.designObjects.filter(o => o.type === 'expression-rule').length

    // Beat 1: Acknowledge
    addMessage('build-progress', 'agent', `Deploying ${story.storyId} to ${env.name}…`)
    await new Promise(r => setTimeout(r, 600))

    // Step 1: Select Target — version check
    if (!versionMatch) {
      addMessage('conflict-resolution', 'agent', `⚠️ Version mismatch — Dev v${sourceVersion}, ${env.name} v${env.platformVersion}. Switching to export/import automatically.`)
      await new Promise(r => setTimeout(r, 700))
    }

    // Step 2: Prepare Deployment — comparison summary
    setIsThinking(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsThinking(false)
    addMessage('info', 'agent', `Compared against ${env.name}: ${newCount} new · ${modCount} modified · 0 conflicts.`, [
      { label: 'See changes', value: 'see-changes', style: 'SECONDARY' },
    ])
    await new Promise(r => setTimeout(r, 500))

    // Step 3: Inspect Deployment
    addMessage('build-progress', 'agent', `Inspecting…`)
    setIsThinking(true)
    await new Promise(r => setTimeout(r, 1200))
    setIsThinking(false)

    // If story already passed validation, inspection is clean
    addMessage('info', 'agent', `Inspection passed ✅ All precedents found, no warnings, ${exprRuleCount} rule tests passing.`)
    await new Promise(r => setTimeout(r, 400))

    // Step 4: Governance
    if (env.approvalRequired) {
      addMessage('build-progress', 'agent', `${env.name} requires approval. Sent to ${env.designatedApprover}.${env.separationOfDuties ? ' (separation of duties)' : ''}`)
      await new Promise(r => setTimeout(r, 2000))
      addMessage('info', 'agent', `Approved by ${env.designatedApprover} ✅`)
      await new Promise(r => setTimeout(r, 400))
    }

    // Step 5: Deploy execution
    setIsDeploying(true)
    setDeployProgress(0)
    const steps = [15, 35, 60, 85, 100]
    for (const pct of steps) {
      await new Promise(r => setTimeout(r, 600))
      setDeployProgress(pct)
    }
    setIsDeploying(false)

    // Step 6: Result
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, listId: 5, deployedEnvironment: env.name } : s))
    addMessage('deployment-result', 'agent', `Deployed to ${env.name} ✅ ${objCount} objects, ${Math.floor(Math.random() * 8 + 8)}s, no errors.`, [
      { label: 'Promote to UAT', value: 'promote-uat', style: 'PRIMARY' },
      { label: 'Rollback', value: 'rollback', style: 'NEGATIVE' },
    ])
    setSelectedStory(null)
  }

  // --- Chat actions ---
  const handleChatAction = (action: string) => {
    switch (action) {
      // Missing Precedent resolutions
      case 'add-precedent':
        addMessage('user-action', 'user', 'Add to package')
        addMessage('info', 'agent', 'Adding DOCUMENT_RECORD to the package. Re-running validation…')
        setTimeout(() => {
          setStories(prev => prev.map(s => s.storyId === 'US-003' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
          addMessage('validation-result', 'agent', '✅ Precedent added. All validation checks now pass.\n📦 Package ready to deploy.')
        }, 1200)
        break
      case 'deploy-dependency-first':
        addMessage('user-action', 'user', 'Deploy US-005 first')
        addMessage('info', 'agent', 'Noted. I\'ll queue US-005 for deployment before US-003. Please move US-005 to Verification & Validation first.')
        break
      case 'remove-reference':
        addMessage('user-action', 'user', 'Remove reference')
        addMessage('info', 'agent', 'Removing DOCUMENT_RECORD reference from the interface. Re-validating…')
        setTimeout(() => {
          setStories(prev => prev.map(s => s.storyId === 'US-003' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
          addMessage('validation-result', 'agent', '✅ Reference removed. Validation passed.\n📦 Package ready to deploy.')
        }, 1200)
        break

      // Release Overlap resolutions
      case 'deploy-overlap':
        addMessage('user-action', 'user', 'Deploy with overlap')
        addMessage('info', 'agent', '⚠️ Proceeding. The overlapping object will use this story\'s version. Last deploy wins on target.')
        setStories(prev => prev.map(s => s.storyId === 'US-002' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
        break
      case 'exclude':
        addMessage('user-action', 'user', 'Remove from package')
        addMessage('info', 'agent', 'APPROVAL_STATUS removed from package. Re-running validation…')
        setTimeout(() => {
          setStories(prev => prev.map(s => s.storyId === 'US-002' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
          addMessage('validation-result', 'agent', '✅ Validation passed after exclusion.\n📦 Package ready to deploy.')
        }, 1000)
        break
      case 'deploy-mine-first':
        addMessage('user-action', 'user', 'Deploy mine first')
        addMessage('info', 'agent', 'Noted. Your package will deploy first so your APPROVAL_STATUS value will be set. If alice.chen deploys US-001 later, her value will overwrite.')
        setStories(prev => prev.map(s => s.storyId === 'US-002' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
        break

      // Expression Rule Test resolutions
      case 'debug-tests':
        addMessage('user-action', 'user', 'Help me debug')
        addMessage('info', 'agent', 'Analyzing EX_GetPendingApprovals…\n\nThe issue is on line 14: the query filter references `approvalStatus` but no records exist with that status in the test data.\n\nFix: Add a null check before filtering, or update test data to include a pending record.\n\nShall I apply the null check fix?', [
          { label: 'Apply fix', value: 'apply-fix', style: 'PRIMARY' },
          { label: 'I\'ll fix manually', value: 'manual-fix', style: 'SECONDARY' },
        ])
        break
      case 'apply-fix':
        addMessage('user-action', 'user', 'Apply fix')
        addMessage('info', 'agent', 'Fix applied. Re-running expression rule tests…')
        setTimeout(() => {
          setStories(prev => prev.map(s => s.storyId === 'US-002' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
          addMessage('validation-result', 'agent', '✅ All expression rule tests now pass.\n📦 Package ready to deploy.')
        }, 1500)
        break
      case 'manual-fix':
        addMessage('user-action', 'user', 'I\'ll fix manually')
        addMessage('info', 'agent', 'Understood. Run validation again when you\'re ready — click "Run Validation" on the card.')
        break
      case 'skip-tests':
        addMessage('user-action', 'user', 'Skip tests (force)')
        addMessage('info', 'agent', '⚠️ Tests skipped. Deploy enabled but proceed with caution — untested rules may fail on the target environment.')
        setStories(prev => prev.map(s => s.storyId === 'US-002' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
        break
      case 'revalidate':
        addMessage('user-action', 'user', 'Re-run tests')
        addMessage('info', 'agent', 'Re-running validation…')
        setTimeout(() => {
          setStories(prev => prev.map(s => s.storyId === 'US-002' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
          addMessage('validation-result', 'agent', '✅ All tests pass on re-validation.\n📦 Package ready to deploy.')
        }, 1500)
        break

      // Cross-Release Dependency resolutions
      case 'move-dep-forward':
        addMessage('user-action', 'user', 'Move US-006 forward')
        addMessage('info', 'agent', 'Moving US-006 from Sprint 24.4 → Sprint 24.3. Dependency resolved.\nRe-running validation…')
        setTimeout(() => {
          setStories(prev => prev.map(s => s.storyId === 'US-004' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
          setStories(prev => prev.map(s => s.storyId === 'US-006' ? { ...s, releaseId: 1 } : s))
          addMessage('validation-result', 'agent', '✅ Cross-release dependency resolved. Validation passed.\n📦 Package ready to deploy.')
        }, 1200)
        break
      case 'move-story-back':
        addMessage('user-action', 'user', 'Move US-004 back')
        addMessage('info', 'agent', 'Moving US-004 from Sprint 24.3 → Sprint 24.4. It will deploy together with US-006.')
        setStories(prev => prev.map(s => s.storyId === 'US-004' ? { ...s, releaseId: 2, validationStatus: 'passed' as ValidationStatus } : s))
        addMessage('validation-result', 'agent', '✅ Dependency resolved. Both stories in Sprint 24.4.\n📦 Package ready to deploy.')
        break
      case 'include-in-package':
        addMessage('user-action', 'user', 'Include in package')
        addMessage('info', 'agent', 'Adding NOTIFICATION_TEMPLATE directly to US-004\'s package. Re-validating…')
        setTimeout(() => {
          setStories(prev => prev.map(s => s.storyId === 'US-004' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
          addMessage('validation-result', 'agent', '✅ Object included. Validation passed.\n📦 Package ready to deploy.')
        }, 1200)
        break

      // Version Mismatch resolutions
      case 'use-export-import':
        addMessage('user-action', 'user', 'Proceed with export/import')
        addMessage('info', 'agent', 'Switching to export/import method. Validation passed with fallback method noted.')
        setStories(prev => prev.map(s => s.storyId === 'US-001' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
        break
      case 'wait-upgrade':
        addMessage('user-action', 'user', 'Wait for upgrade')
        addMessage('info', 'agent', 'Understood. Deploy button will remain disabled until the environment version matches. I\'ll notify you when Pre-Prod is upgraded.')
        break
      case 'different-env':
        addMessage('user-action', 'user', 'Choose different environment')
        addMessage('info', 'agent', 'Available environments with v24.3:\n• Staging (v24.3) — no approval needed\n• UAT (v24.3) — approval required\n\nSelect your target when you click Deploy.')
        setStories(prev => prev.map(s => s.storyId === 'US-001' ? { ...s, validationStatus: 'passed' as ValidationStatus } : s))
        break

      // --- Deployment flow actions ---
      case 'see-changes':
        addMessage('user-action', 'user', 'See changes')
        const lastDeployedStory = stories.find(s => s.validationStatus === 'passed' && !s.deployedEnvironment && s.listId >= 4)
        if (lastDeployedStory) {
          const nc = Math.ceil(lastDeployedStory.designObjects.length * 0.6)
          addMessage('info', 'agent', `New:\n${lastDeployedStory.designObjects.slice(0, nc).map(o => `  ${o.name} (${o.type})`).join('\n')}\n\nModified:\n${lastDeployedStory.designObjects.slice(nc).map(o => `  ${o.name} — fields updated`).join('\n')}`)
        }
        break
      case 'deploy-without':
        addMessage('user-action', 'user', 'Deploy without it')
        addMessage('info', 'agent', `Proceeding without the missing precedent. Referenced objects may show errors on target.`)
        setTimeout(async () => {
          setIsDeploying(true); setDeployProgress(0)
          const targetStory = stories.find(s => s.storyId === 'US-003' && s.listId >= 4)
          for (const pct of [20, 50, 80, 100]) { await new Promise(r => setTimeout(r, 500)); setDeployProgress(pct) }
          setIsDeploying(false)
          if (targetStory) setStories(prev => prev.map(s => s.id === targetStory.id ? { ...s, listId: 5, deployedEnvironment: deployTarget } : s))
          addMessage('deployment-result', 'agent', `Deployed to ${deployTarget} ✅ with warnings. Check referenced objects.`, [
            { label: 'Promote to UAT', value: 'promote-uat', style: 'PRIMARY' },
            { label: 'Rollback', value: 'rollback', style: 'NEGATIVE' },
          ])
        }, 100)
        break
      case 'deploy-with-warnings':
        addMessage('user-action', 'user', 'Deploy anyway')
        addMessage('build-progress', 'agent', `Deploying with warnings…`)
        setTimeout(async () => {
          setIsDeploying(true); setDeployProgress(0)
          const targetStory = stories.find(s => s.storyId === 'US-002' && s.listId >= 4)
          for (const pct of [20, 45, 70, 90, 100]) { await new Promise(r => setTimeout(r, 500)); setDeployProgress(pct) }
          setIsDeploying(false)
          if (targetStory) setStories(prev => prev.map(s => s.id === targetStory.id ? { ...s, listId: 5, deployedEnvironment: deployTarget } : s))
          addMessage('deployment-result', 'agent', `Deployed to ${deployTarget} ✅ ${stories.find(s => s.storyId === 'US-002')?.designObjects.length ?? 0} objects. Warnings noted — verify record types on target.`, [
            { label: 'Promote to UAT', value: 'promote-uat', style: 'PRIMARY' },
            { label: 'Rollback', value: 'rollback', style: 'NEGATIVE' },
          ])
        }, 100)
        break
      case 'reinspect':
        addMessage('user-action', 'user', 'Inspect again')
        setIsThinking(true)
        setTimeout(() => {
          setIsThinking(false)
          addMessage('info', 'agent', `Re-inspection complete. Same warnings persist — source tables not found on target. This is expected if DB scripts haven't run yet.`, [
            { label: 'Deploy anyway', value: 'deploy-with-warnings', style: 'PRIMARY' },
            { label: 'Cancel', value: 'cancel-deploy', style: 'NEGATIVE' },
          ])
        }, 1500)
        break
      case 'cancel-deploy':
        addMessage('user-action', 'user', 'Cancel')
        addMessage('info', 'agent', `Deployment cancelled. Story stays in Verification & Validation. You can try again anytime.`)
        break
      case 'promote-uat':
        addMessage('user-action', 'user', 'Promote to UAT')
        addMessage('build-progress', 'agent', `Promoting to UAT…`)
        setTimeout(async () => {
          setIsThinking(true)
          await new Promise(r => setTimeout(r, 800))
          setIsThinking(false)
          addMessage('info', 'agent', `UAT requires approval. Sent to manager.jones.`)
          await new Promise(r => setTimeout(r, 2000))
          addMessage('info', 'agent', `Approved by manager.jones ✅`)
          setIsDeploying(true); setDeployProgress(0)
          for (const pct of [25, 55, 85, 100]) { await new Promise(r => setTimeout(r, 500)); setDeployProgress(pct) }
          setIsDeploying(false)
          addMessage('deployment-result', 'agent', `Deployed to UAT ✅ All objects synced, no errors.`, [
            { label: 'Promote to Pre-Prod', value: 'promote-preprod', style: 'PRIMARY' },
            { label: 'Rollback on UAT', value: 'rollback', style: 'NEGATIVE' },
          ])
        }, 100)
        break
      case 'promote-preprod':
        addMessage('user-action', 'user', 'Promote to Pre-Prod')
        addMessage('build-progress', 'agent', `Promoting to Pre-Prod…`)
        setTimeout(async () => {
          setIsThinking(true)
          await new Promise(r => setTimeout(r, 800))
          setIsThinking(false)
          addMessage('conflict-resolution', 'agent', `⚠️ Version mismatch — Pre-Prod is v24.2. Switching to export/import.`)
          await new Promise(r => setTimeout(r, 500))
          addMessage('info', 'agent', `Pre-Prod requires approval. Sent to manager.jones.`)
          await new Promise(r => setTimeout(r, 2000))
          addMessage('info', 'agent', `Approved ✅`)
          setIsDeploying(true); setDeployProgress(0)
          for (const pct of [30, 60, 90, 100]) { await new Promise(r => setTimeout(r, 500)); setDeployProgress(pct) }
          setIsDeploying(false)
          addMessage('deployment-result', 'agent', `Deployed to Pre-Prod ✅ via export/import.`, [
            { label: 'Promote to Production', value: 'promote-prod', style: 'PRIMARY' },
            { label: 'Rollback', value: 'rollback', style: 'NEGATIVE' },
          ])
        }, 100)
        break
      case 'promote-prod':
        addMessage('user-action', 'user', 'Promote to Production')
        addMessage('conflict-resolution', 'agent', `⚠️ Production requires approval with separation of duties — approver must be different from deployer.\n\nSent to director.smith.`)
        setTimeout(async () => {
          await new Promise(r => setTimeout(r, 2500))
          addMessage('info', 'agent', `Approved by director.smith ✅`)
          setIsDeploying(true); setDeployProgress(0)
          for (const pct of [20, 50, 75, 100]) { await new Promise(r => setTimeout(r, 600)); setDeployProgress(pct) }
          setIsDeploying(false)
          addMessage('deployment-result', 'agent', `Deployed to Production ✅ 🎉 All environments complete.`)
        }, 100)
        break
      case 'rollback':
        addMessage('user-action', 'user', 'Rollback')
        addMessage('build-progress', 'agent', `Rolling back…`)
        setTimeout(() => {
          addMessage('info', 'agent', `Rollback complete ✅ Restored to pre-deploy checkpoint. Story moved back to V&V.`)
        }, 1500)
        break
      case 'remind-approver':
        addMessage('user-action', 'user', 'Remind approver')
        addMessage('info', 'agent', `Reminder sent. I'll let you know when they respond.`)
        break

      // Release override from chat
      case 'create-new-release':
        addMessage('user-action', 'user', 'Create new release')
        setShowManageReleases(true)
        addMessage('info', 'agent', 'Opening Manage Releases — create a new one there and I\'ll assign the story to it.')
        break
      default:
        // Handle dynamic assign-release actions
        if (action.startsWith('assign-release-')) {
          const parts = action.replace('assign-release-', '').split('-')
          const storyId = parseInt(parts[0])
          const releaseId = parseInt(parts[1])
          const story = stories.find(s => s.id === storyId)
          const release = releases.find(r => r.id === releaseId)
          if (story && release) {
            addMessage('user-action', 'user', release.name)
            if (story.deployedEnvironment) {
              addMessage('info', 'agent', `⚠️ ${story.storyId} has already been deployed to ${story.deployedEnvironment}. The deployed package stays in the original release on that environment.`)
            }
            setStories(prev => prev.map(s => s.id === storyId ? { ...s, releaseId } : s))
            addMessage('info', 'agent', `Done. ${story.storyId} "${story.title}" is now in "${release.name}". No dependency issues — it can deploy independently.`)
          }
        }
        break
    }
  }

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    addMessage('user-action', 'user', chatInput)
    const input = chatInput.toLowerCase()
    setChatInput('')

    if (input.includes('override') || input.includes('change release') || input.includes('move') && input.includes('release')) {
      // Try to detect a story ID in the message (e.g., "move US-003 to Sprint 24.4")
      const storyMatch = input.match(/us-(\d+)/)
      const targetStory = storyMatch ? stories.find(s => s.storyId.toLowerCase() === `us-${storyMatch[1]}`) : null

      if (targetStory) {
        const activeReleases = releases.filter(r => r.status === 'active')
        addMessage('info', 'agent', `Got it — changing the release for ${targetStory.storyId} "${targetStory.title}".\n\nCurrent release: ${getReleaseName(targetStory.releaseId)}\n\nWhich release should it go to?\n${activeReleases.map(r => `• ${r.name}`).join('\n')}\n\nJust type the release name, or say "create new" to make a new one.`, [
          ...activeReleases.map(r => ({ label: r.name, value: `assign-release-${targetStory.id}-${r.id}`, style: 'SECONDARY' as const })),
          { label: 'Create new', value: 'create-new-release', style: 'PRIMARY' as const },
        ])
      } else {
        addMessage('info', 'agent', `Which story do you want to change the release for? Tell me the story ID (e.g., "change release for US-003") or click on a story card and update the Release dropdown there.`)
      }
    } else if (input.includes('deploy')) {
      addMessage('info', 'agent', 'Select a story card and click its Deploy button to start deployment.')
    } else if (input.includes('validate')) {
      addMessage('info', 'agent', 'Move a story to the Verification & Validation column, then click the validate icon on the card.')
    } else {
      addMessage('info', 'agent', 'I can help with:\n• Change a release — "move US-003 to Sprint 24.4"\n• Validate — "validate US-002"\n• Deploy — "deploy US-001"\n\nWhat would you like to do?')
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <ApplicationHeader name="Dev Agent — Deployment Board" userInitials="AC" />

      {/* Composer prompt banner */}
      {!releases.some(r => r.status === 'active') && (
        <div className="px-5 pt-4">
          <MessageBanner
            primaryText="Before building, create a release to group your deployment packages."
            backgroundColor="INFO"
            highlightColor="INFO"
            icon="info"
          />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-1 shrink-0">
          <div className="group relative w-10 h-10">
            <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18"/><path d="M8 6v12"/></svg>
            </button>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">Plan</span>
          </div>
          <div className="group relative w-10 h-10">
            <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/></svg>
            </button>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">Explore</span>
          </div>
          <div className="group relative w-10 h-10">
            <button onClick={() => setActiveView('build')} className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeView === 'build' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'} transition-colors`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </button>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">Build</span>
          </div>
          <div className="group relative w-10 h-10">
            <button onClick={() => setActiveView('packages')} className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeView === 'packages' || activeView === 'package-detail' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'} transition-colors`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </button>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">Packages</span>
          </div>
          <div className="group relative w-10 h-10">
            <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3"/></svg>
            </button>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">Deploy</span>
          </div>
          <div className="group relative w-10 h-10">
            <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
            </button>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">Monitor</span>
          </div>
        </div>

        {/* Board area */}
        {activeView === 'build' ? (
        <div className="flex-1 overflow-auto px-5 py-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <HeadingField text="Employee Onboarding App" size="MEDIUM_PLUS" fontWeight="SEMI_BOLD" marginBelow="NONE" headingTag="H1" />
              <DropdownField
                label=""
                labelPosition="COLLAPSED"
                value={selectedReleaseId ?? '__all__'}
                choiceLabels={['All Releases', ...releases.filter(r => r.status === 'active').map(r => r.name)]}
                choiceValues={['__all__', ...releases.filter(r => r.status === 'active').map(r => r.id)]}
                onChange={(val: string | number) => setSelectedReleaseId(val === '__all__' ? null : val as number)}
                placeholder="All Releases"
                marginBelow="NONE"
              />
            </div>
            <div className="flex items-center gap-2">
              {!chatOpen && (
                <ButtonWidget
                  label="Dev Agent"
                  style="OUTLINE"
                  color="#152B99"
                  size="SMALL"
                  icon="Sparkles"
                  onClick={() => setChatOpen(true)}
                />
              )}
              <ButtonWidget
                label="Manage Releases"
                style="SOLID"
                color="#152B99"
                size="SMALL"
                onClick={() => setShowManageReleases(true)}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mb-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('board')}
              className={`pb-2 text-xs font-semibold ${activeTab === 'board' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ▫ BOARD
            </button>
            <button
              onClick={() => setActiveTab('all-objects')}
              className={`pb-2 text-xs font-semibold ${activeTab === 'all-objects' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ≡ ALL OBJECTS
            </button>
            <button
              onClick={() => setActiveTab('plug-ins')}
              className={`pb-2 text-xs font-semibold ${activeTab === 'plug-ins' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🔌 PLUG-INS
            </button>
            <button
              onClick={() => setActiveTab('unreferenced')}
              className={`pb-2 text-xs font-semibold ${activeTab === 'unreferenced' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ○ UNREFERENCED OBJECTS
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'board' ? (
          <>
          {/* Kanban columns */}
          <div className="flex gap-3 pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
            {COLUMNS.map(col => {
              const colStories = storiesForColumn(col.id)
              return (
                <div
                  key={col.id}
                  className="flex-1 min-w-[200px]"
                  onDragOver={(e) => { e.preventDefault(); setDragOverColId(col.id) }}
                  onDragLeave={() => setDragOverColId(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverColId(null)
                    if (draggedStoryId !== null) {
                      const movedStory = stories.find(s => s.id === draggedStoryId)
                      setStories(prev => prev.map(s => s.id === draggedStoryId ? { ...s, listId: col.id } : s))
                      if (movedStory) {
                        addMessage('info', 'agent', `Moved ${movedStory.storyId} to "${col.name}".`)
                        // Auto-generate design objects when moved to In Progress from To Do
                        if (movedStory.listId === 1 && col.id === 2) {
                          handleAutoBuild(movedStory)
                        }
                      }
                      setDraggedStoryId(null)
                    }
                  }}
                >
                  <div className={`bg-slate-100 rounded-lg p-3 h-full transition-colors ${dragOverColId === col.id ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">{col.name}</span>
                        <span className="text-xs bg-slate-300 text-slate-700 rounded-full px-2 py-0.5">{colStories.length}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {colStories.map(story => (
                        <div
                          key={story.id}
                          draggable
                          onDragStart={() => setDraggedStoryId(story.id)}
                          onDragEnd={() => { setDraggedStoryId(null); setDragOverColId(null) }}
                          onClick={() => { setSelectedStory(story); setShowStoryDetail(true) }}
                          className={`bg-white rounded-lg border overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggedStoryId === story.id ? 'opacity-50' : ''} ${selectedStory?.id === story.id ? 'shadow-lg' : 'border-slate-200'}`}
                        >
                          {/* Top stripe based on column */}
                          {story.deployedEnvironment ? (
                            <div className="h-1 bg-green-500" />
                          ) : col.id === 1 ? (
                            <div className="h-1 bg-gray-400" />
                          ) : col.id === 2 ? (
                            <div className="h-1 bg-amber-400" />
                          ) : col.id === 3 ? (
                            <div className="h-1 bg-orange-400" />
                          ) : col.id === 4 ? (
                            <div className="h-1 bg-purple-400" />
                          ) : (
                            <div className="h-1 bg-green-500" />
                          )}
                          <div className="p-3">
                          {/* Story ID + Release */}
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-slate-500">{story.storyId}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{getReleaseName(story.releaseId)}</span>
                          </div>
                          {/* Title */}
                          <p className="text-sm font-medium text-slate-900 mb-2">{truncateTitle(story.title)}</p>
                          {/* Status badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {story.buildStatus === 'in-progress' && (
                              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                                <RefreshCw size={10} className="animate-spin" /> Building
                              </span>
                            )}
                            {story.validationStatus !== 'not-started' && !story.deployedEnvironment && (
                              <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                                story.validationStatus === 'passed' ? 'bg-green-50 text-green-700' :
                                story.validationStatus === 'failed' ? 'bg-red-50 text-red-700' :
                                'bg-yellow-50 text-yellow-700'
                              }`}>
                                {story.validationStatus === 'passed' ? <CheckCircle size={10} /> :
                                 story.validationStatus === 'failed' ? <XCircle size={10} /> :
                                 <Clock size={10} />}
                                {getValidationLabel(story.validationStatus)}
                              </span>
                            )}
                            {story.deployedEnvironment && (
                              <span className="text-xs text-green-600 font-medium">✓ Deployed to {story.deployedEnvironment}</span>
                            )}
                          </div>

                          {/* Deploy split button - only in V&V or Done column when validated */}
                          {(col.id === 4 || col.id === 5) && story.validationStatus === 'passed' && !story.deployedEnvironment && (
                            <div className="mt-3 flex">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedStory(story); setShowDeployDialog(true) }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-l-md transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
                                Deploy
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedStory(story); setShowDeployDialog(true) }}
                                className="px-2 py-2 text-white bg-indigo-700 hover:bg-indigo-800 rounded-r-md border-l border-indigo-500 transition-colors"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                              </button>
                            </div>
                          )}
                          {/* Validate button - in V&V column when not yet validated */}
                          {col.id === 4 && story.validationStatus === 'not-started' && (
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-slate-400">Not validated</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRunValidation(story) }}
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 transition-colors"
                                title="Run Validation"
                              >
                                <CheckCircle size={14} />
                              </button>
                            </div>
                          )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          </>
          ) : activeTab === 'all-objects' ? (
          <div className="pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">Name</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">Type</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">Story</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.flatMap(s => s.designObjects.map(obj => ({ ...obj, storyId: s.storyId, storyTitle: s.title }))).map(obj => (
                    <tr key={obj.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-800">{obj.name}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                          obj.type === 'interface' ? 'bg-blue-50 text-blue-700' :
                          obj.type === 'expression-rule' ? 'bg-green-50 text-green-700' :
                          obj.type === 'record-type' ? 'bg-purple-50 text-purple-700' :
                          obj.type === 'process-model' ? 'bg-orange-50 text-orange-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{obj.type}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-500">{obj.storyId}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          obj.status === 'completed' ? 'bg-green-50 text-green-700' :
                          obj.status === 'building' ? 'bg-amber-50 text-amber-700' :
                          obj.status === 'failed' ? 'bg-red-50 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{obj.status}</span>
                      </td>
                    </tr>
                  ))}
                  {stories.flatMap(s => s.designObjects).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No design objects generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          ) : activeTab === 'plug-ins' ? (
          <div className="pb-4 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 220px)' }}>
            <p className="text-sm text-slate-400">No plug-ins installed.</p>
          </div>
          ) : (
          <div className="pb-4 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 220px)' }}>
            <p className="text-sm text-slate-400">No unreferenced objects found.</p>
          </div>
          )}
        </div>
        ) : activeView === 'package-detail' && detailPkgStory ? (
        /* Package Detail View */
        <div className="flex-1 overflow-auto">
          {/* Top bar */}
          <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DropdownField label="" labelPosition="COLLAPSED" value={detailPkgStory.id} choiceLabels={[`${detailPkgStory.storyId} ${detailPkgStory.title}`]} choiceValues={[detailPkgStory.id]} onChange={() => {}} marginBelow="NONE" />
            </div>
            <div className="flex items-center gap-2">
              <ButtonWidget label="EXPORT PACKAGE" style="OUTLINE" color="SECONDARY" size="SMALL" onClick={() => {}} />
              <ButtonWidget label="COMPARE AND DEPLOY" style="OUTLINE" color="SECONDARY" size="SMALL" onClick={() => { setSelectedStory(detailPkgStory); setShowDeployDialog(true) }} />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 flex items-center gap-6 border-b border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 py-2 cursor-pointer hover:text-slate-700" onClick={() => { setActiveView('packages') }}>BOARD</span>
            <span className="text-[11px] font-semibold text-indigo-700 border-b-2 border-indigo-700 py-2">ALL OBJECTS</span>
            <span className="text-[11px] text-slate-400 py-2">PLUG-INS</span>
            <span className="text-[11px] text-slate-400 py-2">UNREFERENCED OBJECTS</span>
          </div>

          <div className="flex">
            {/* Left: Objects table */}
            <div className="flex-1 px-6 py-4 overflow-auto">
              {/* Filters row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <TextField label="" labelPosition="COLLAPSED" value="" onChange={() => {}} placeholder="Name or description" marginBelow="NONE" />
                </div>
                <div className="w-40">
                  <DropdownField label="" labelPosition="COLLAPSED" value="__all__" choiceLabels={['All Objects']} choiceValues={['__all__']} onChange={() => {}} placeholder="OBJECT TYPE" marginBelow="NONE" />
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <TextField label="" labelPosition="COLLAPSED" value="" onChange={() => {}} placeholder="Last Modified By" marginBelow="NONE" />
                <div className="w-48">
                  <DropdownField label="" labelPosition="COLLAPSED" value="__all__" choiceLabels={['Any - Any']} choiceValues={['__all__']} onChange={() => {}} placeholder="LAST MODIFIED ON" marginBelow="NONE" />
                </div>
                <button className="text-xs text-slate-500 hover:text-slate-700 whitespace-nowrap">CLEAR FILTERS</button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mb-4">
                <ButtonWidget label="NEW ▾" style="OUTLINE" color="SECONDARY" size="SMALL" onClick={() => {}} />
                <ButtonWidget label="ADD EXISTING ▾" style="OUTLINE" color="SECONDARY" size="SMALL" onClick={() => {}} />
                <ButtonWidget label="REVIEW MODIFIED OBJECTS" style="OUTLINE" color="SECONDARY" size="SMALL" onClick={() => {}} />
              </div>

              {/* Objects table */}
              {detailPkgStory.designObjects.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="w-8 py-2"><input type="checkbox" className="rounded border-slate-300" /></th>
                      <th className="text-left py-2 text-xs font-semibold text-slate-600">Name</th>
                      <th className="text-left py-2 text-xs font-semibold text-slate-600">Description</th>
                      <th className="text-left py-2 text-xs font-semibold text-slate-600">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailPkgStory.designObjects.map(obj => (
                      <tr key={obj.id} className="hover:bg-slate-50">
                        <td className="py-2 px-1"><input type="checkbox" className="rounded border-slate-300" /></td>
                        <td className="py-2 text-sm text-indigo-600 font-medium">{obj.name}</td>
                        <td className="py-2 text-xs text-slate-500">{obj.purposeSummary}</td>
                        <td className="py-2 text-xs text-slate-400">{detailPkgStory.createdOn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No objects available</p>
              )}
            </div>

            {/* Right: Package Details sidebar */}
            <div className="w-72 border-l border-slate-200 px-5 py-4 shrink-0 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <HeadingField text="Package Details" size="SMALL" fontWeight="SEMI_BOLD" marginBelow="NONE" />
                <button className="text-slate-400 hover:text-slate-700" onClick={() => { setEditPkgStory(detailPkgStory); setEditPkgName(`${detailPkgStory.storyId} ${detailPkgStory.title}`); setEditPkgTicket(''); setEditPkgDescription(detailPkgStory.description); setEditPkgRelease(detailPkgStory.releaseId ?? ''); setShowEditPackage(true) }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">Name</p>
                  <p className="text-slate-600">{detailPkgStory.storyId} {detailPkgStory.title}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Description</p>
                  <p className="text-slate-600">{detailPkgStory.description || '–'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Release</p>
                  <p className="text-slate-600">{getReleaseName(detailPkgStory.releaseId)}</p>
                  <a href="#" className="text-xs text-indigo-600 hover:underline">Learn more about releases ↗</a>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Created</p>
                  <p className="text-slate-600">{detailPkgStory.createdOn} by {detailPkgStory.createdBy}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Last Modified</p>
                  <p className="text-slate-600">{detailPkgStory.createdOn} by {detailPkgStory.createdBy}</p>
                </div>
                <a href="#" className="text-xs text-indigo-600 hover:underline inline-block">📋 Copy Package Link</a>
              </div>

              {/* App Configurations */}
              <div className="border-t border-slate-200 mt-5 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <HeadingField text="App Configurations" size="SMALL" fontWeight="SEMI_BOLD" marginBelow="NONE" />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                </div>
                <p className="text-sm text-slate-500">Not in package</p>
                <a href="#" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">Learn more about application configurations ↗</a>
              </div>

              {/* Import Customization File */}
              <div className="border-t border-slate-200 mt-5 pt-4">
                <HeadingField text="Import Customization File" size="SMALL" fontWeight="SEMI_BOLD" marginBelow="STANDARD" />
                <div className="border border-dashed border-slate-300 rounded-lg px-4 py-3 flex items-center gap-3 mb-2">
                  <ButtonWidget label="UPLOAD" style="OUTLINE" color="SECONDARY" size="SMALL" onClick={() => {}} />
                  <span className="text-xs text-slate-400">Drop or paste file here</span>
                </div>
                <a href="#" className="text-xs text-indigo-600 hover:underline inline-block">⬇ Download Template</a>
              </div>

              {/* Database Scripts */}
              <div className="border-t border-slate-200 mt-5 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <HeadingField text="Database Scripts" size="SMALL" fontWeight="SEMI_BOLD" marginBelow="NONE" />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Source</p>
                  <div className="border border-dashed border-slate-300 rounded-lg px-4 py-3 flex items-center gap-3 mb-2">
                    <ButtonWidget label="UPLOAD" style="OUTLINE" color="SECONDARY" size="SMALL" onClick={() => {}} />
                    <span className="text-xs text-slate-400">Drop or paste file here</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mb-1 mt-3">Target</p>
                  <div className="border border-dashed border-slate-300 rounded-lg px-4 py-3 flex items-center gap-3">
                    <ButtonWidget label="UPLOAD" style="OUTLINE" color="SECONDARY" size="SMALL" onClick={() => {}} />
                    <span className="text-xs text-slate-400">Drop or paste file here</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        ) : (
        /* Packages View */
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between">
            <HeadingField text="Packages" size="LARGE" fontWeight="BOLD" marginBelow="NONE" headingTag="H1" />
            <div className="flex items-center gap-2">
              <ButtonWidget label="CREATE PACKAGE" style="SOLID" color="#152B99" size="SMALL" icon="Plus" onClick={() => setShowCreatePackage(true)} />
              <ButtonWidget label="MANAGE RELEASES" style="OUTLINE" color="#152B99" size="SMALL" onClick={() => setShowManageReleases(true)} />
            </div>
          </div>

          {/* Info banner */}
          <div className="px-6 mb-4">
            <MessageBanner
              primaryText="Use releases to organize your packages for deployment. Associating packages with releases allows you to easily keep track of which functionality to deploy at the same time."
              backgroundColor="INFO"
              highlightColor="INFO"
              icon="info"
            />
          </div>

          {/* Content: Filters sidebar + Table */}
          <div className="flex px-6 gap-6">
            {/* Filters sidebar */}
            <div className="w-52 shrink-0">
              <p className="text-sm font-semibold text-slate-700 mb-3">Filters{(pkgFilterName || pkgFilterRelease !== '__all__' || pkgFilterObject || pkgFilterModifiedBy !== '__all__') ? ' (active)' : ''}</p>

              <div className="mb-4">
                <TextField label="Name or Description" value={pkgFilterName} onChange={setPkgFilterName} placeholder="" labelPosition="ABOVE" marginBelow="STANDARD" />
              </div>
              <div className="mb-4">
                <DropdownField label="Release" value={pkgFilterRelease} choiceLabels={['All releases', ...releases.map(r => r.name)]} choiceValues={['__all__', ...releases.map(r => r.id)]} onChange={(val: string | number) => setPkgFilterRelease(val)} labelPosition="ABOVE" marginBelow="STANDARD" />
              </div>
              <div className="mb-4">
                <TextField label="Object" value={pkgFilterObject} onChange={setPkgFilterObject} placeholder="Search by name or UUID" labelPosition="ABOVE" marginBelow="STANDARD" />
              </div>
              <div className="mb-4">
                <DropdownField label="Last Modified By" value={pkgFilterModifiedBy} choiceLabels={['All users', ...Array.from(new Set(stories.map(s => s.createdBy)))]} choiceValues={['__all__', ...Array.from(new Set(stories.map(s => s.createdBy)))]} onChange={(val: string) => setPkgFilterModifiedBy(val)} labelPosition="ABOVE" marginBelow="STANDARD" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Last Modified</p>
                <div className="space-y-1.5 text-sm text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lastMod" checked={pkgFilterLastMod === 'today'} onChange={() => setPkgFilterLastMod('today')} className="text-indigo-600" /> Today</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lastMod" checked={pkgFilterLastMod === 'last-7'} onChange={() => setPkgFilterLastMod('last-7')} className="text-indigo-600" /> Last 7 days</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lastMod" checked={pkgFilterLastMod === 'last-month'} onChange={() => setPkgFilterLastMod('last-month')} className="text-indigo-600" /> Last month</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lastMod" checked={pkgFilterLastMod === 'last-6'} onChange={() => setPkgFilterLastMod('last-6')} className="text-indigo-600" /> Last 6 months</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lastMod" checked={pkgFilterLastMod === 'custom'} onChange={() => setPkgFilterLastMod('custom')} className="text-indigo-600" /> Custom</label>
                </div>
              </div>
            </div>

            {/* Package table */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500 mb-3">{getFilteredPackages().length} results</p>

              {getFilteredPackages().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-sm text-slate-400">No packages match the current filters.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="w-6 py-2"><input type="checkbox" className="rounded border-slate-300" /></th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-slate-600">Name</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-slate-600">Description</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-slate-600">Release</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-slate-600">Ticket</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-slate-600 whitespace-nowrap">Last Modified</th>
                      <th className="w-6 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getFilteredPackages().map(story => (
                      <tr key={story.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-1"><input type="checkbox" className="rounded border-slate-300" /></td>
                        <td className="py-2 px-2">
                          <a href="#" onClick={(e) => { e.preventDefault(); setDetailPkgStory(story); setActiveView('package-detail') }} className="text-indigo-600 hover:underline font-medium text-xs">
                            {story.storyId} {story.title}
                          </a>
                        </td>
                        <td className="py-2 px-2 text-slate-500 text-xs max-w-[120px] truncate">{story.description || '–'}</td>
                        <td className="py-2 px-2 text-slate-500 text-xs whitespace-nowrap">{getReleaseName(story.releaseId) !== 'Unassigned' ? getReleaseName(story.releaseId) : '–'}</td>
                        <td className="py-2 px-2 text-slate-500 text-xs">–</td>
                        <td className="py-2 px-2">
                          <div className="text-[11px] text-slate-600 whitespace-nowrap">{story.createdOn}</div>
                          <div className="text-[11px] text-slate-400">{story.createdBy}</div>
                        </td>
                        <td className="py-2 px-1">
                          <button className="text-indigo-600 hover:text-indigo-800 transition-colors" title="Edit" onClick={(e) => { e.stopPropagation(); setEditPkgStory(story); setEditPkgName(`${story.storyId} ${story.title}`); setEditPkgTicket(''); setEditPkgDescription(story.description); setEditPkgRelease(story.releaseId ?? ''); setShowEditPackage(true) }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Chat Panel */}
        {chatOpen ? (
        <div className="w-96 border-l border-slate-200 bg-white flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Dev Agent</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
          </div>

          {/* Messages or empty state */}
          {chatMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                <Sparkles size={20} className="text-indigo-600" />
              </div>
              <p className="text-sm text-slate-500 mb-6">What would you like to build?</p>
              <div className="w-full flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask Dev Agent"
                  className="flex-1 text-sm border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
          <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {chatMessages.map(msg => (
              <div key={msg.id} className="animate-[fadeIn_0.3s_ease-out]">
                {msg.sender === 'user' ? (
                  <div className="flex items-end gap-2 justify-end">
                    <div className="bg-indigo-600 text-white rounded-xl rounded-br-sm px-4 py-3 shadow-sm max-w-[85%]">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles size={12} className="text-indigo-600" />
                    </div>
                    <div className={`flex-1 min-w-0 rounded-xl rounded-tl-sm px-4 py-3 shadow-sm transition-all duration-300 ${
                      msg.type === 'conflict-resolution' ? 'bg-white border border-slate-200 border-l-4 border-l-amber-500' :
                      msg.type === 'error' ? 'bg-white border border-slate-200 border-l-4 border-l-red-500' :
                      msg.type === 'deployment-result' ? 'bg-green-50 border border-green-100' :
                      msg.type === 'build-progress' ? 'bg-slate-50' :
                      'bg-slate-50'
                    }`}>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {msg.actions && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100">
                          {msg.actions.map(action => (
                            <button
                              key={action.value}
                              onClick={() => handleChatAction(action.value)}
                              className={`text-xs font-medium px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 ${
                                action.style === 'PRIMARY' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' :
                                action.style === 'NEGATIVE' ? 'border border-red-300 text-red-700 hover:bg-red-50' :
                                'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isThinking && (
              <div className="flex items-start gap-2.5 animate-[fadeIn_0.2s_ease-out]">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles size={12} className="text-indigo-600 animate-pulse" />
                </div>
                <div className="bg-slate-50 rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            {isBuildingObjects && (
              <div className="flex items-start gap-2.5 animate-[fadeIn_0.2s_ease-out]">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles size={12} className="text-indigo-600 animate-pulse" />
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-sm text-slate-600 mb-2">{progressLabel}… {deployProgress}%</p>
                  <div className="w-full bg-indigo-100 rounded-full h-1">
                    <div className="bg-indigo-600 h-1 rounded-full transition-all duration-500 ease-out" style={{ width: `${deployProgress}%` }} />
                  </div>
                </div>
              </div>
            )}
            {isDeploying && (
              <div className="flex items-start gap-2.5 animate-[fadeIn_0.2s_ease-out]">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles size={12} className="text-indigo-600 animate-pulse" />
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-sm text-slate-600 mb-2">Deploying… {deployProgress}%</p>
                  <div className="w-full bg-indigo-100 rounded-full h-1">
                    <div className="bg-indigo-600 h-1 rounded-full transition-all duration-500 ease-out" style={{ width: `${deployProgress}%` }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-4 py-3 border-t border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask Dev Agent"
                className="flex-1 text-sm border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim()}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          </>
          )}
        </div>
        ) : null}
      </div>

      {/* Story Detail Modal */}
      {showStoryDetail && selectedStory && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-6">
            {/* Top actions */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setShowStoryDetail(false)} className="text-sm text-indigo-600 hover:underline font-medium">‹ Back</button>
              <div className="flex items-center gap-2">
                <ButtonWidget label="EDIT" style="OUTLINE" color="SECONDARY" size="SMALL" icon="Pencil" onClick={() => {}} />
                <ButtonWidget label="DELETE" style="OUTLINE" color="NEGATIVE" size="SMALL" icon="Trash2" onClick={() => {}} />
              </div>
            </div>

            {/* Title */}
            <HeadingField text={selectedStory.title} size="LARGE" fontWeight="BOLD" marginBelow="MORE" />

            {/* Description */}
            <div className="flex gap-8 mb-6">
              <span className="text-sm text-slate-500 w-40 shrink-0 pt-2">Description</span>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[60px]">
                <p className="text-sm text-slate-700 leading-relaxed">{selectedStory.description}</p>
              </div>
            </div>

            {/* Acceptance Criteria */}
            <div className="flex gap-8 mb-6">
              <span className="text-sm text-slate-500 w-40 shrink-0 pt-2">Acceptance Criteria</span>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[60px]">
                <p className="text-sm text-slate-700 leading-relaxed">All design objects are created and ready for use. Validation checks pass before deployment.</p>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4 mb-8">
              <div className="flex gap-8 items-center">
                <span className="text-sm text-slate-500 w-40 shrink-0">Assignee</span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-indigo-100 text-[10px] font-bold text-indigo-700">AU</span>
                  <span className="text-sm text-slate-800">{selectedStory.createdBy}</span>
                </div>
              </div>
              <div className="flex gap-8 items-center">
                <span className="text-sm text-slate-500 w-40 shrink-0">Priority</span>
                <span className="text-sm text-slate-800">-</span>
              </div>
              <div className="flex gap-8 items-center">
                <span className="text-sm text-slate-500 w-40 shrink-0">Story Points</span>
                <span className="text-sm text-slate-800">-</span>
              </div>
              <div className="flex gap-8 items-center">
                <span className="text-sm text-slate-500 w-40 shrink-0">Status</span>
                <span className="text-sm font-medium text-orange-600">
                  {COLUMNS.find(c => c.id === selectedStory.listId)?.name ?? 'Unknown'}
                </span>
              </div>
              <div className="flex gap-8 items-center">
                <span className="text-sm text-slate-500 w-40 shrink-0">Type</span>
                <span className="text-sm text-slate-800">-</span>
              </div>
              <div className="flex gap-8 items-center">
                <span className="text-sm text-slate-500 w-40 shrink-0">Persona</span>
                <span className="text-sm text-slate-800">-</span>
              </div>
              <div className="flex gap-8 items-center">
                <span className="text-sm text-slate-500 w-40 shrink-0">Release</span>
                <div className="w-48">
                  <DropdownField
                    label=""
                    labelPosition="COLLAPSED"
                    value={selectedStory.releaseId ?? ''}
                    choiceLabels={releases.filter(r => r.status === 'active').map(r => r.name)}
                    choiceValues={releases.filter(r => r.status === 'active').map(r => r.id)}
                    onChange={(val: number) => {
                      const newRelease = releases.find(r => r.id === val)
                      if (selectedStory.deployedEnvironment) {
                        addMessage('info', 'agent', `⚠️ ${selectedStory.storyId} already deployed to ${selectedStory.deployedEnvironment}. Deployed package stays in original release.`)
                      }
                      setStories(prev => prev.map(s => s.id === selectedStory.id ? { ...s, releaseId: val } : s))
                      setSelectedStory({ ...selectedStory, releaseId: val })
                      addMessage('info', 'agent', `Release for ${selectedStory.storyId} "${selectedStory.title}" changed to "${newRelease?.name}".`)
                    }}
                    placeholder="Select a release"
                    marginBelow="NONE"
                  />
                </div>
              </div>
            </div>

            {/* Objects section */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <HeadingField text="Objects" size="MEDIUM" fontWeight="BOLD" marginBelow="NONE" />
                <div className="flex items-center gap-3">
                  <ButtonWidget label="NEW ▾" style="OUTLINE" color="#152B99" size="SMALL" onClick={() => {}} />
                  <ButtonWidget label="ADD EXISTING OBJECTS" style="OUTLINE" color="#152B99" size="SMALL" onClick={() => {}} />
                  <ButtonWidget label="GENERATE WITH COMPOSER" style="OUTLINE" color="#152B99" size="SMALL" onClick={() => {}} />
                </div>
              </div>

              {/* Search and filter row */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <TextField label="" labelPosition="COLLAPSED" value="" onChange={() => {}} placeholder="Search" marginBelow="NONE" />
                </div>
                <div className="w-40">
                  <DropdownField label="" labelPosition="COLLAPSED" value="__all__" choiceLabels={['All Objects']} choiceValues={['__all__']} onChange={() => {}} marginBelow="NONE" />
                </div>
              </div>

              {/* Object list */}
              {selectedStory.designObjects.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {selectedStory.designObjects.map(obj => (
                    <div key={obj.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                          obj.type === 'interface' ? 'bg-blue-100' :
                          obj.type === 'expression-rule' ? 'bg-green-100' :
                          obj.type === 'record-type' ? 'bg-purple-100' :
                          obj.type === 'process-model' ? 'bg-orange-100' :
                          'bg-slate-100'
                        }`}>
                          <span className={`text-xs font-bold ${
                            obj.type === 'interface' ? 'text-blue-700' :
                            obj.type === 'expression-rule' ? 'text-green-700' :
                            obj.type === 'record-type' ? 'text-purple-700' :
                            obj.type === 'process-model' ? 'text-orange-700' :
                            'text-slate-600'
                          }`}>
                            {obj.type === 'interface' ? 'UI' :
                             obj.type === 'expression-rule' ? 'EX' :
                             obj.type === 'record-type' ? 'RT' :
                             obj.type === 'process-model' ? 'PM' : 'C'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-indigo-600 font-medium hover:underline cursor-pointer">{obj.name}</p>
                          <p className="text-xs text-slate-400">{selectedStory.createdOn} by {selectedStory.createdBy}</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
                    </div>
                  ))}
                </div>
              ) : (
                <RichTextDisplayField
                  value={[<TextItem key="empty" text="No design objects yet. Click 'GENERATE WITH COMPOSER' to start building." size="STANDARD" color="SECONDARY" />]}
                  marginBelow="NONE"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Release Dialog */}
      {showComposerPrompt && (
        <DialogField
          open={true}
          onClose={() => setShowComposerPrompt(false)}
          title="Create Release"
          width="MEDIUM"
        >
          <div className="space-y-4">
            <RichTextDisplayField
              value={[<TextItem key="desc" text="Create a release to group packages for coordinated deployment. All stories will inherit this release." size="STANDARD" color="SECONDARY" />]}
              marginBelow="STANDARD"
            />
            <TextField
              label="Release Name"
              value={newReleaseName}
              onChange={setNewReleaseName}
              placeholder="e.g., Sprint 24.5"
              labelPosition="ABOVE"
              marginBelow="STANDARD"
            />
            <TextField
              label="Target Date (optional)"
              value={newReleaseDate}
              onChange={setNewReleaseDate}
              placeholder="YYYY-MM-DD"
              labelPosition="ABOVE"
              marginBelow="STANDARD"
            />
            <ButtonArrayLayout
              buttons={[
                { label: 'Create & Start Building', style: 'SOLID', color: 'ACCENT', onClick: handleCreateRelease, disabled: !newReleaseName.trim() },
                { label: 'Cancel', style: 'OUTLINE', color: 'SECONDARY', onClick: () => setShowComposerPrompt(false) },
              ]}
              align="START"
            />
          </div>
        </DialogField>
      )}

      {/* Release Override Dialog */}
      {showReleaseModal && selectedStory && (
        <DialogField
          open={true}
          onClose={() => setShowReleaseModal(false)}
          title={`Override Release for ${selectedStory.storyId}`}
          width="MEDIUM"
        >
          <div className="space-y-4">
            <RichTextDisplayField
              value={[<TextItem key="current" text={`Current release: ${getReleaseName(selectedStory.releaseId)}`} size="STANDARD" color="SECONDARY" />]}
              marginBelow="STANDARD"
            />
            <DropdownField
              label="Select Release"
              value={selectedStory.releaseId}
              choiceLabels={releases.filter(r => r.status === 'active').map(r => r.name)}
              choiceValues={releases.filter(r => r.status === 'active').map(r => r.id)}
              onChange={(val: number) => handleReleaseOverride(selectedStory.id, val)}
              labelPosition="ABOVE"
              marginBelow="STANDARD"
            />
            <ButtonArrayLayout
              buttons={[
                { label: 'Cancel', style: 'OUTLINE', color: 'SECONDARY', onClick: () => setShowReleaseModal(false) },
              ]}
              align="START"
            />
          </div>
        </DialogField>
      )}

      {/* Deploy Confirmation Dialog */}
      {showDeployDialog && selectedStory && (
        <DialogField
          open={true}
          onClose={() => setShowDeployDialog(false)}
          title={`Deploy ${selectedStory.storyId}`}
          width="MEDIUM"
        >
          <div className="space-y-4">
            <RichTextDisplayField
              value={[<TextItem key="info" text={`Deploy "${selectedStory.title}" package to a target environment.`} size="STANDARD" color="SECONDARY" />]}
              marginBelow="STANDARD"
            />
            <DropdownField
              label="Target Environment"
              value={deployTarget}
              choiceLabels={environments.map(e => `${e.name} (v${e.platformVersion})${e.approvalRequired ? ' — Approval required' : ''}`)}
              choiceValues={environments.map(e => e.name)}
              onChange={(val: string) => setDeployTarget(val)}
              labelPosition="ABOVE"
              marginBelow="STANDARD"
            />
            <ButtonArrayLayout
              buttons={[
                { label: 'Deploy', style: 'SOLID', color: 'ACCENT', onClick: () => handleDeploy(selectedStory) },
                { label: 'Cancel', style: 'OUTLINE', color: 'SECONDARY', onClick: () => setShowDeployDialog(false) },
              ]}
              align="START"
            />
          </div>
        </DialogField>
      )}

      {/* Edit Package Dialog */}
      {showEditPackage && editPkgStory && (
        <DialogField
          open={true}
          onClose={() => { setShowEditPackage(false); setEditPkgStory(null) }}
          title="Edit Package"
          width="MEDIUM_PLUS"
        >
          <div className="space-y-5">
            <TextField
              label="Name"
              value={editPkgName}
              onChange={setEditPkgName}
              placeholder=""
              labelPosition="ABOVE"
              marginBelow="NONE"
              required={true}
            />
            <TextField
              label="Link to Ticket"
              value={editPkgTicket}
              onChange={setEditPkgTicket}
              placeholder=""
              labelPosition="ABOVE"
              marginBelow="NONE"
            />
            <TextField
              label="Description"
              value={editPkgDescription}
              onChange={setEditPkgDescription}
              placeholder=""
              labelPosition="ABOVE"
              marginBelow="NONE"
            />
            <div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <DropdownField
                    label="Release"
                    value={editPkgRelease}
                    choiceLabels={releases.filter(r => r.status === 'active').map(r => r.name)}
                    choiceValues={releases.filter(r => r.status === 'active').map(r => r.id)}
                    onChange={(val: string | number) => setEditPkgRelease(val)}
                    placeholder="Select a release"
                    labelPosition="ABOVE"
                    marginBelow="NONE"
                  />
                </div>
                <button onClick={() => setShowManageReleases(true)} className="mt-5 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shrink-0" title="Create new release">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
              <a href="#" className="text-xs text-indigo-600 hover:underline mt-1.5 inline-block">Learn more about releases ↗</a>
            </div>

            <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
              <ButtonWidget
                label="CANCEL"
                style="OUTLINE"
                color="SECONDARY"
                size="SMALL"
                onClick={() => { setShowEditPackage(false); setEditPkgStory(null) }}
              />
              <ButtonWidget
                label="SAVE"
                style="SOLID"
                color="#152B99"
                size="SMALL"
                disabled={!editPkgName.trim()}
                onClick={() => {
                  if (editPkgStory) {
                    setStories(prev => prev.map(s => s.id === editPkgStory.id ? { ...s, description: editPkgDescription, releaseId: editPkgRelease as number || s.releaseId } : s))
                    addMessage('info', 'system', `Package "${editPkgName}" updated.`)
                  }
                  setShowEditPackage(false); setEditPkgStory(null)
                }}
              />
            </div>
          </div>
        </DialogField>
      )}

      {/* Create Package Dialog */}
      {showCreatePackage && (
        <DialogField
          open={true}
          onClose={() => { setShowCreatePackage(false); setNewPkgName(''); setNewPkgTicket(''); setNewPkgDescription(''); setNewPkgRelease('') }}
          title="Create Package"
          width="MEDIUM_PLUS"
        >
          <div className="space-y-5">
            <TextField
              label="Name"
              value={newPkgName}
              onChange={setNewPkgName}
              placeholder='E.g. [CM-1234] Updating Cases Record to add related action - "Review Cases"'
              labelPosition="ABOVE"
              marginBelow="NONE"
              required={true}
            />
            <TextField
              label="Link to Ticket"
              value={newPkgTicket}
              onChange={setNewPkgTicket}
              placeholder=""
              labelPosition="ABOVE"
              marginBelow="NONE"
            />
            <TextField
              label="Description"
              value={newPkgDescription}
              onChange={setNewPkgDescription}
              placeholder=""
              labelPosition="ABOVE"
              marginBelow="NONE"
            />
            <div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <DropdownField
                    label="Release"
                    value={newPkgRelease}
                    choiceLabels={releases.filter(r => r.status === 'active').map(r => r.name)}
                    choiceValues={releases.filter(r => r.status === 'active').map(r => r.id)}
                    onChange={(val: string | number) => setNewPkgRelease(val)}
                    placeholder="Select a release"
                    labelPosition="ABOVE"
                    marginBelow="NONE"
                  />
                </div>
                <button onClick={() => setShowManageReleases(true)} className="mt-5 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shrink-0" title="Create new release">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
              <a href="#" className="text-xs text-indigo-600 hover:underline mt-1.5 inline-block">Learn more about releases ↗</a>
            </div>

            <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
              <ButtonWidget
                label="CANCEL"
                style="OUTLINE"
                color="SECONDARY"
                size="SMALL"
                onClick={() => { setShowCreatePackage(false); setNewPkgName(''); setNewPkgTicket(''); setNewPkgDescription(''); setNewPkgRelease('') }}
              />
              <div className="flex items-center gap-2">
                <ButtonWidget
                  label="CREATE"
                  style="SOLID"
                  color="#152B99"
                  size="SMALL"
                  disabled={!newPkgName.trim()}
                  onClick={() => {
                    addMessage('info', 'system', `📦 Package "${newPkgName}" created.`)
                    setShowCreatePackage(false); setNewPkgName(''); setNewPkgTicket(''); setNewPkgDescription(''); setNewPkgRelease('')
                  }}
                />
                <ButtonWidget
                  label="CREATE AND ADD ANOTHER"
                  style="OUTLINE"
                  color="#152B99"
                  size="SMALL"
                  disabled={!newPkgName.trim()}
                  onClick={() => {
                    addMessage('info', 'system', `📦 Package "${newPkgName}" created.`)
                    setNewPkgName(''); setNewPkgTicket(''); setNewPkgDescription(''); setNewPkgRelease('')
                  }}
                />
              </div>
            </div>
          </div>
        </DialogField>
      )}

      {/* Manage Releases Dialog */}
      {showManageReleases && (
        <DialogField
          open={true}
          onClose={() => { setShowManageReleases(false); setEditingRelease(null); setNewReleaseName(''); setNewReleaseDate('') }}
          title="Manage Releases"
          width="MEDIUM_PLUS"
        >
          <div className="space-y-4">
            {/* Existing releases list */}
            <div className="space-y-2">
              {releases.map(r => (
                <div key={r.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.targetDate ? `Target: ${r.targetDate}` : 'No target date'} · {r.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ButtonWidget
                      label="Edit"
                      style="OUTLINE"
                      color="SECONDARY"
                      size="SMALL"
                      onClick={() => { setEditingRelease(r); setNewReleaseName(r.name); setNewReleaseDate(r.targetDate ?? '') }}
                    />
                    <ButtonWidget
                      label="Delete"
                      style="OUTLINE"
                      color="NEGATIVE"
                      size="SMALL"
                      onClick={() => {
                        setReleases(prev => prev.filter(x => x.id !== r.id))
                        setStories(prev => prev.map(s => s.releaseId === r.id ? { ...s, releaseId: null } : s))
                        if (selectedReleaseId === r.id) setSelectedReleaseId(null)
                        addMessage('info', 'system', `Release "${r.name}" deleted. Affected stories are now unassigned.`)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Create / Edit form */}
            <div className="border-t border-gray-200 pt-4">
              <HeadingField text={editingRelease ? 'Edit Release' : 'Create New Release'} size="SMALL" fontWeight="SEMI_BOLD" marginBelow="STANDARD" />
              <TextField
                label="Release Name"
                value={newReleaseName}
                onChange={setNewReleaseName}
                placeholder="e.g., Sprint 24.5"
                labelPosition="ABOVE"
                marginBelow="STANDARD"
              />
              <TextField
                label="Target Date (optional)"
                value={newReleaseDate}
                onChange={setNewReleaseDate}
                placeholder="YYYY-MM-DD"
                labelPosition="ABOVE"
                marginBelow="STANDARD"
              />
              <ButtonArrayLayout
                buttons={[
                  {
                    label: editingRelease ? 'Save Changes' : 'Create Release',
                    style: 'SOLID',
                    color: 'ACCENT',
                    disabled: !newReleaseName.trim(),
                    onClick: () => {
                      if (editingRelease) {
                        setReleases(prev => prev.map(r => r.id === editingRelease.id ? { ...r, name: newReleaseName.trim(), targetDate: newReleaseDate || null } : r))
                        addMessage('info', 'system', `Release "${newReleaseName.trim()}" updated.`)
                        setEditingRelease(null)
                      } else {
                        handleCreateRelease()
                      }
                      setNewReleaseName(''); setNewReleaseDate('')
                    },
                  },
                  { label: 'Close', style: 'OUTLINE', color: 'SECONDARY', onClick: () => { setShowManageReleases(false); setEditingRelease(null); setNewReleaseName(''); setNewReleaseDate('') } },
                ]}
                align="START"
              />
            </div>
          </div>
        </DialogField>
      )}
    </div>
  )
}
