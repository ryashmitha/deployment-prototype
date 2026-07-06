# Example SAIL Interfaces

This directory contains example SAIL interfaces generated using the Aurora starter template.

## Examples

### Award Cycle Time Dashboard
**File:** `dashboard.sail`

A comprehensive analytics dashboard featuring:
- Line chart showing average cycle time trends over 12 months
- KPI cards displaying key metrics (number of awards, average cycle time)
- Donut chart breaking down cycle time by phase
- Filterable data grid with award details
- Sidebar with performance insights and improvement areas
- Ranked lists of longest cycle times by award and vendor

**Example prompt to generate something similar:**
```
Create a dashboard showing award cycle time analytics with:
- A line chart tracking monthly trends with a threshold reference line
- KPI cards for total awards and average processing time
- A donut chart showing time spent in each phase (draft, review, approved, awaiting signature)
- Filter dropdowns for date, department, vendor, contracting officer, and spend buckets
- A data grid displaying award details with multiple columns
- A sidebar showing performance callouts and areas needing improvement
- Use Aurora Design System styling with cards and proper spacing
```

**Use case:** Executive dashboards, performance analytics, cycle time tracking, process improvement monitoring

## How to Use These Examples

1. **Copy and paste** into Appian Designer to see them in action
2. **Modify** to fit your specific data and requirements
3. **Learn** from the patterns and structure
4. **Reference** when describing interfaces you want to generate

## Generating Your Own

In Kiro IDE, describe what you need:

```
Create a dashboard showing customer satisfaction metrics with trend charts and KPI cards
```

```
Build a form for employee onboarding with validation and multi-step wizard
```

```
Generate a work queue interface with status filters and action buttons
```

The AI will use the Aurora Design System and SAIL syntax guidance to generate professional, syntactically correct code following these same patterns.
