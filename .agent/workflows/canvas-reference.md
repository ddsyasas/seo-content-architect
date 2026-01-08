# Canvas Controls Reference

## Mouse Controls
| Action | Control |
|--------|---------|
| **Drag node** | Left-click and drag on a node |
| **Pan canvas** | Middle-click drag OR Right-click drag |
| **Pan canvas** | Scroll (panOnScroll enabled) |
| **Zoom** | Use toolbar +/- buttons |
| **Multi-select** | Hold Shift + Left-click nodes |

## Key ReactFlow Props
```tsx
nodesDraggable={canEdit}     // Enable/disable node dragging based on permissions
selectionOnDrag={false}       // Disable selection box on left-click drag
panOnDrag={[1, 2]}            // Pan with middle (1) and right (2) mouse buttons
panOnScroll={true}            // Allow panning with scroll wheel
multiSelectionKeyCode="Shift" // Hold Shift to multi-select
deleteKeyCode={null}          // Custom delete handling (not keyboard)
```

## Important Files
- `src/components/canvas/canvas-editor.tsx` - Main canvas component
- `src/components/canvas/canvas-toolbar.tsx` - Toolbar with zoom controls
- `src/lib/utils/roles.ts` - Role permissions (canEdit, etc.)

## How Auto-Linking Works
1. Article save extracts all links from content
2. External links → Creates "external" node type if URL doesn't exist (normalized)
3. Internal links → Creates edges to matching article nodes by slug
4. URL normalization removes protocol, www, and trailing slashes for matching
