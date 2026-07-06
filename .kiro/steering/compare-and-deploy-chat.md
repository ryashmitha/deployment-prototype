---
inclusion: fileMatch
fileMatchPattern: "**/deployment-board*"
---

# Chat UI — Lightweight & Fluid Design

## Core Principles

1. **Breathe** — generous whitespace, no cramped containers
2. **Progressive disclosure** — headline first, details only on demand
3. **Conversational rhythm** — short messages, natural pauses, not data dumps
4. **Minimal chrome** — reduce borders/boxes. Let typography and spacing work.
5. **Acknowledge quickly** — instant brief acknowledgment before heavy work

## Message Styles

### Quick status (majority of messages)
- No container, no border, no background
- Just text + icon, left-aligned, subtle
- Examples: "Building T-1..." / "Creating package..." / "3 objects added ✓"

### Result message (after process completes)
- Slightly bolder headline text
- One line summary, expandable for more
- Example: "**T-1 ready to deploy** — 5 objects, all checks passed."
- [Deploy] [See what's included ▾]

### Attention needed (requires user input)
- Left accent border (thin, 2px) in amber or red — NOT a full box
- Brief plain language explanation
- Buttons below, spaced comfortably, max 2-3 options
- Example: ⚠️ "PET record type was also changed by Naveen. Deploy yours anyway?"
- [Deploy mine] [Wait, let me check]

### Success
- Simple one-liner with check: "Deployed to Staging ✅" — that's it
- No container

## Flow Pattern: Acknowledge → Work → Result

Beat 1 (instant): "Deploying T-1 to Staging..."
Beat 2 (working): typing indicator / progress dots
Beat 3 (result): "Done ✅ Live on Staging."

Never dump everything in one message.

## Progress

- Short operations (<10s): animated dots only, then result
- Long operations (>15s): step-by-step with checkmarks
- Show "Deploying T-1..." with dots. Then "Deployed ✅"

## Comparison Results: Inline, Not Table

"Comparing against Staging: 3 new · 2 modified · 0 conflicts"
[See changes ▾]

Expandable plain list. No boxes. No table borders.

## Buttons

- ONE primary (solid) per message — the recommended action
- Secondary options as text links or ghost buttons
- Max 3 options visible

## Conflicts: Conversational

One paragraph explaining what happened + two options. Not a bordered card with technical fields.

## Deployment Summary: One Line

"Deployed to Staging ✅ 5 objects, 12 seconds, no errors."
[Promote to UAT] [Rollback]

## Scrollback Timeline

Clean flowing narrative when scrolling up:
- "Building T-1..."
- "5 objects created ✓"
- "All checks passed ✅ Ready to deploy."
- "Deploying to Staging..."
- "Deployed ✅"

## Timing

- Status updates: immediate
- After button click: acknowledge within 200ms
- >3 seconds: show typing indicator
- >10 seconds: show progress text
- >30 seconds: step-by-step with estimates

## Style Rules Summary

| Element | Treatment |
|---------|-----------|
| Status updates | Plain text, no container |
| Results | Bold headline + one-line + expandable |
| Warnings | Thin left border (amber) + 2 buttons |
| Errors | Thin left border (red) + what to do |
| Success | One line + ✅ + next action |
| Progress | Dots for short, steps for long |
| Buttons | One primary, rest text links |
| Containers | Use SPARINGLY |
