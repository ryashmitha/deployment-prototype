---
inclusion: fileMatch
fileMatchPattern: "**/deployment-board*"
---

# Chat UI & Conversation Design Guidelines

## Visual Style
- Chat bubbles: rounded-xl, shadow-sm, px-4 py-3
- Agent messages: align left, bg-slate-50 or bg-gray-50
- User messages: align right, bg-indigo-600 text-white
- Smooth transitions: transition-all duration-300
- Messages animate in with fade-up (opacity-0 → opacity-100, translateY)
- Generous spacing: space-y-4
- Timestamps: text-xs text-gray-400

## Loading & Feedback States
- Typing indicator: 3 bouncing dots in a chat bubble
- Skeleton loaders for content being generated
- Validation checks appear sequentially with staggered animation (~500ms between each)
- Deployment: non-blocking progress state with animated spinner + updating status text
- Success: brief green flash or check animation
- Error/warning: left-border on message bubble (border-l-4 border-amber-500 or border-red-500)

## Conversation Tone
- Sound like a knowledgeable colleague, not a robot
- Natural, concise language — no corporate jargon
- First-person casual: "I found an issue" not "An issue has been detected"
- Contextual: reference story by name — "T-3 View Pet Details" not just "T-3"
- Bad news: what happened → why → solutions
- Short paragraphs, digestible chunks
- Multiple issues: present one at a time
- Celebrate wins: "All checks passed ✅ You're good to deploy."

## Message Types

### Status updates (non-interactive)
- Brief, one-line, muted styling (text-gray-600, smaller font)
- Example: "Creating package for T-1..." / "Running validation checks..."

### Results (informational)
- Card-style container (bg-white border rounded-lg p-4)
- Icons for scanning (✅ ❌ ⚠️)
- Clean bullet lists
- Collapsible details for verbose info

### Action required (interactive)
- Elevated card (shadow-md)
- Colored left border (border-l-4 border-amber-500 warnings, border-red-500 errors)
- Primary button: bg-indigo-600 text-white rounded-lg px-4 py-2
- Secondary: border border-gray-300 text-gray-700 rounded-lg px-4 py-2
- Destructive: border border-red-300 text-red-700
- Buttons horizontal with gap-2
- After selection: buttons disappear, choice shows as user message

### Deployment progress
- Sequential step reveal with progress bar (h-1 bg-indigo-100 with bg-indigo-600 fill)
- On completion: all steps ✅, success message

## Do NOT
- Robotic language
- Dump all info at once
- Raw technical identifiers without context
- Leave user waiting without feedback
- Make chat feel like a log dump
- Generic confirmation dialogs — keep interactions inline
