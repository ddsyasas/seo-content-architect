# Canvas Features Implementation

This document describes the canvas-related features implemented in this session, including undo/redo functionality, export capabilities, and various UI improvements.

---

## Table of Contents

1. [Undo/Redo System](#undoredo-system)
2. [Export Functionality](#export-functionality)
3. [View Canvas Button](#view-canvas-button)
4. [Dark Mode Fixes](#dark-mode-fixes)
5. [Edge Selection Improvements](#edge-selection-improvements)
6. [Files Modified](#files-modified)

---

## Undo/Redo System

### Overview
A complete undo/redo system for the canvas that tracks all node and edge changes, allowing users to revert or redo their actions.

### Features
- **Undo Button**: Reverts the last action
- **Redo Button**: Restores a previously undone action
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + Z` - Undo
  - `Ctrl/Cmd + Shift + Z` - Redo
- **History Limit**: Maximum 50 entries to prevent memory issues
- **Auto-clear**: History clears when switching projects

### Tracked Actions
The following actions are tracked in the history:

| Action | Description |
|--------|-------------|
| Added Node | When a new node is created via "Add Node" button |
| Deleted Node | When a node is deleted (via Delete key or panel) |
| Added Link | When a new edge/connection is created |
| Deleted Link | When an edge is deleted |
| Moved Node | When a node is dragged to a new position |

### Technical Implementation

#### History Store (`src/lib/store/canvas-history-store.ts`)
A dedicated Zustand store manages the undo/redo state:

```typescript
interface CanvasSnapshot {
    nodes: Node[];
    edges: Edge[];
    timestamp: number;
    action: string;  // Description of the action
}

interface CanvasHistoryState {
    past: CanvasSnapshot[];      // Stack of previous states
    future: CanvasSnapshot[];    // Stack of undone states
    currentSnapshot: CanvasSnapshot | null;

    // Actions
    setCurrentSnapshot: (nodes, edges) => void;
    pushState: (action: string) => void;
    undo: () => CanvasSnapshot | null;
    redo: () => CanvasSnapshot | null;
    clear: () => void;
}
```

#### How It Works
1. **Before an action**: Call `setCurrentSnapshot(nodes, edges)` to capture the current state
2. **After the action**: Call `pushState('Action Description')` to save it to history
3. **Undo**: Pops from `past` stack, pushes to `future` stack, returns previous state
4. **Redo**: Pops from `future` stack, pushes to `past` stack, returns next state

#### Position Change Handling
Node dragging is handled specially to avoid flooding the history:
- Snapshot is captured when drag **starts** (`dragging: true`)
- State is pushed to history when drag **ends** (`dragging: false`)
- Uses refs (`nodesRef`, `edgesRef`) to avoid stale closure issues

### UI Components
- **Toolbar Buttons**: Located between "Add Node" and zoom controls
- **Disabled State**: Buttons are grayed out when no undo/redo is available
- **Tooltips**: Show keyboard shortcuts on hover
- **Editor-only**: Buttons only appear when `canEdit=true`

---

## Export Functionality

### Overview
Allows users to export their canvas as either a PNG image or CSV data file.

### Features

#### PNG Export
- Captures the entire visible canvas
- High quality (2x pixel ratio)
- Light gray background (#f9fafb)
- Filename format: `canvas-{projectId}-{date}.png`

#### CSV Export
Exports all canvas data in a structured format:

**Nodes Section:**
| Column | Description |
|--------|-------------|
| ID | Unique node identifier |
| Type | pillar, cluster, supporting, planned, external |
| Title | Node title |
| Status | planned, writing, published, needs_update |
| Target Keyword | SEO target keyword |
| Slug | URL slug |
| Position X | X coordinate on canvas |
| Position Y | Y coordinate on canvas |

**Edges Section:**
| Column | Description |
|--------|-------------|
| ID | Unique edge identifier |
| Source Node | ID of the source node |
| Target Node | ID of the target node |
| Edge Type | hierarchy, interlinks, backlink, outbound |
| Label | Anchor text / keyword |

Filename format: `canvas-{projectId}-{date}.csv`

### Technical Implementation

#### Dependencies
```bash
npm install html-to-image
```

#### PNG Export Function
```typescript
const handleExportPNG = useCallback(async () => {
    const reactFlowWrapper = canvasRef.current.querySelector('.react-flow');
    const dataUrl = await toPng(reactFlowWrapper, {
        backgroundColor: '#f9fafb',
        quality: 1,
        pixelRatio: 2,
    });
    // Trigger download...
}, [projectId]);
```

#### CSV Export Function
```typescript
const handleExportCSV = useCallback(() => {
    // Build CSV content from nodes and edges
    const csvContent = [
        '--- NODES ---',
        nodeHeaders.join(','),
        ...nodeRows,
        '',
        '--- EDGES ---',
        edgeHeaders.join(','),
        ...edgeRows,
    ].join('\n');
    // Trigger download...
}, [nodes, edges, projectId]);
```

### UI Components
- **Export Dropdown**: Located after "Fit" button in toolbar
- **Menu Options**: "Export as PNG" and "Export as CSV"
- **Icons**: Image icon for PNG, Spreadsheet icon for CSV

---

## View Canvas Button

### Overview
A quick navigation button in the article editor that takes users directly to the canvas view.

### Features
- Located in the article editor header (between back button and title)
- Styled with indigo color to stand out
- Shows grid icon with "Canvas" text
- Hidden on mobile screens (visible on `sm` and larger)

### Technical Implementation

#### Article Editor (`src/components/editor/article-editor.tsx`)
```tsx
<button
    onClick={() => router.push(`/project/${projectId}?tab=canvas`)}
    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
    title="View Canvas"
>
    <LayoutGrid className="w-4 h-4" />
    <span>Canvas</span>
</button>
```

#### Query Parameter Support (`src/components/project/project-page-client.tsx`)
Added support for `?tab=canvas` query parameter:
```typescript
const searchParams = useSearchParams();
const initialTab = searchParams.get('tab') === 'canvas' ? 'canvas' : 'articles';
const [activeTab, setActiveTab] = useState(initialTab);
```

---

## Dark Mode Fixes

### New Article Page (`src/components/editor/new-article-page.tsx`)
Added dark mode support to the entire "New Article" form:

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Page background | `bg-gray-50` | `dark:bg-gray-900` |
| Card | `bg-white` | `dark:bg-gray-800` |
| Card border | `border-gray-200` | `dark:border-gray-700` |
| Title | `text-gray-900` | `dark:text-white` |
| Labels | `text-gray-700` | `dark:text-gray-300` |
| Back arrow | `text-gray-600` | `dark:text-gray-300` |
| Content type buttons (selected) | `bg-indigo-50 text-indigo-700` | `dark:bg-indigo-900/30 dark:text-indigo-300` |
| Content type buttons (unselected) | `border-gray-200 text-gray-700` | `dark:border-gray-600 dark:text-gray-300` |
| Error message | `bg-red-50 text-red-700` | `dark:bg-red-900/30 dark:text-red-300` |

### Canvas Toolbar (`src/components/canvas/canvas-toolbar.tsx`)
Added dark mode support to toolbar elements:
- Zoom controls background and borders
- Dropdown menus
- Button hover states

---

## Edge Selection Improvements

### Anchor Text Label Z-Index (`src/components/canvas/edges/custom-label-edge.tsx`)
Fixed overlapping anchor text labels:
- Default z-index: `1000`
- Selected z-index: `9999` (brings to front)
- Visual highlighting when selected (red border, larger padding)

### Edge Line Elevation
Added `elevateEdgesOnSelect={true}` to ReactFlow component:
- Selected edge line comes to the front
- Entire edge (including start point) is elevated above other edges

---

## Files Modified

### New Files Created
| File | Description |
|------|-------------|
| `src/lib/store/canvas-history-store.ts` | Zustand store for undo/redo history |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/canvas/canvas-toolbar.tsx` | Added undo/redo buttons, export dropdown, dark mode |
| `src/components/canvas/canvas-editor.tsx` | Integrated history store, added export handlers, keyboard shortcuts |
| `src/components/canvas/edges/custom-label-edge.tsx` | Dynamic z-index, selection highlighting |
| `src/components/editor/article-editor.tsx` | Added "View Canvas" button |
| `src/components/editor/new-article-page.tsx` | Dark mode support |
| `src/components/project/project-page-client.tsx` | Query parameter support for tab selection |

### Dependencies Added
```json
{
  "html-to-image": "^1.x.x"
}
```

---

## Testing Checklist

### Undo/Redo
- [ ] Add a node → Undo → Node disappears
- [ ] Redo → Node reappears
- [ ] Move a node → Undo → Node returns to original position
- [ ] Delete a node → Undo → Node is restored
- [ ] Add an edge → Undo → Edge is removed
- [ ] Delete an edge → Undo → Edge is restored
- [ ] Keyboard shortcuts work (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
- [ ] Buttons disabled when no undo/redo available

### Export
- [ ] PNG export downloads an image file
- [ ] PNG includes all visible nodes and edges
- [ ] CSV export downloads a CSV file
- [ ] CSV contains all node data with correct headers
- [ ] CSV contains all edge data with correct headers
- [ ] Filenames include project ID and date

### View Canvas Button
- [ ] Button visible in article editor header
- [ ] Clicking navigates to project page with Canvas tab active
- [ ] Button hidden on mobile screens

### Dark Mode
- [ ] New Article form displays correctly in dark mode
- [ ] Canvas toolbar displays correctly in dark mode
- [ ] All text is readable in both modes

---

*Last updated: January 2026*
