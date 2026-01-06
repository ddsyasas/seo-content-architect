# SEO Content Architect - Product Requirements Document

## Executive Summary

**Product Name:** SEO Content Architect (working title)

**Purpose:** A web-based visual planning tool that enables SEO professionals and content marketers to design, visualize, and manage content architecture using an interactive canvas. Users can map pillar pages, cluster articles, and internal linking structures in a Miro-style drag-and-drop interface.

**Target Users:** SEO specialists, content strategists, digital marketers, content writers, and marketing agencies managing multi-site content strategies.

**Core Value Proposition:** Replace scattered spreadsheets with an intuitive visual workspace where content hierarchies and link relationships become immediately clear, enabling better strategic decisions and easier content audits.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend Framework | Next.js 14 (App Router) | Server components, API routes, excellent DX |
| Styling | Tailwind CSS | Rapid UI development, consistent design |
| Database | Supabase (PostgreSQL) | Auth, real-time, storage, row-level security |
| Canvas Library | React Flow | Purpose-built for node-based editors, zoom/pan, performant |
| State Management | Zustand | Lightweight, simple, works well with React Flow |
| Deployment | Vercel | Seamless Next.js integration |
| Icons | Lucide React | Clean, consistent icon set |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js App Router                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Auth      │  │  Dashboard  │  │  Canvas Editor  │   │  │
│  │  │   Pages     │  │   /projects │  │  /project/[id]  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │                           │                               │  │
│  │                    ┌──────┴──────┐                        │  │
│  │                    │   Zustand   │                        │  │
│  │                    │    Store    │                        │  │
│  │                    └──────┬──────┘                        │  │
│  │                           │                               │  │
│  │                    ┌──────┴──────┐                        │  │
│  │                    │ React Flow  │                        │  │
│  │                    │   Canvas    │                        │  │
│  │                    └─────────────┘                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │  Database   │  │     Row Level           │  │
│  │  (Built-in) │  │ (PostgreSQL)│  │     Security            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables

#### 1. profiles
Extends Supabase auth.users with additional user data.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### 2. projects
Each project represents one website/content strategy.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  color TEXT DEFAULT '#6366f1', -- Project accent color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only access their own projects
CREATE POLICY "Users can CRUD own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_projects_user_id ON projects(user_id);
```

#### 3. nodes
Content pieces (pillars, clusters, planned articles).

```sql
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Node type: 'pillar', 'cluster', 'planned', 'external'
  node_type TEXT NOT NULL DEFAULT 'cluster',
  
  -- Content details
  title TEXT NOT NULL,
  slug TEXT,
  url TEXT,
  target_keyword TEXT,
  
  -- Status: 'planned', 'writing', 'published', 'needs_update'
  status TEXT DEFAULT 'planned',
  
  -- Optional metadata
  notes TEXT,
  word_count_target INTEGER,
  assigned_to TEXT,
  publish_date DATE,
  
  -- Canvas position (React Flow coordinates)
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  
  -- Custom styling
  color TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

-- Users can only access nodes in their projects
CREATE POLICY "Users can CRUD nodes in own projects" ON nodes
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_nodes_project_id ON nodes(project_id);
CREATE INDEX idx_nodes_node_type ON nodes(node_type);
```

#### 4. edges
Connections between nodes (links, hierarchy).

```sql
CREATE TABLE edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Source and target nodes
  source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  
  -- Edge type: 'hierarchy' (pillar->cluster), 'internal_link', 'planned_link', 'external_link'
  edge_type TEXT NOT NULL DEFAULT 'internal_link',
  
  -- Optional label for the connection
  label TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate edges
  UNIQUE(source_node_id, target_node_id, edge_type)
);

-- Enable RLS
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;

-- Users can only access edges in their projects
CREATE POLICY "Users can CRUD edges in own projects" ON edges
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_edges_project_id ON edges(project_id);
CREATE INDEX idx_edges_source ON edges(source_node_id);
CREATE INDEX idx_edges_target ON edges(target_node_id);
```

#### 5. canvas_settings
Per-project canvas view settings.

```sql
CREATE TABLE canvas_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Viewport state
  viewport_x FLOAT DEFAULT 0,
  viewport_y FLOAT DEFAULT 0,
  viewport_zoom FLOAT DEFAULT 1,
  
  -- Display preferences
  show_labels BOOLEAN DEFAULT true,
  snap_to_grid BOOLEAN DEFAULT false,
  grid_size INTEGER DEFAULT 20,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE canvas_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD canvas settings for own projects" ON canvas_settings
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
```

### Database Functions

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_nodes_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_canvas_settings_updated_at
  BEFORE UPDATE ON canvas_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create canvas settings when project is created
CREATE OR REPLACE FUNCTION handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO canvas_settings (project_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION handle_new_project();
```

---

## Folder Structure

```
seo-content-architect/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Project list
│   │   ├── project/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Canvas editor
│   │   └── layout.tsx            # Dashboard shell with sidebar
│   ├── api/
│   │   ├── projects/
│   │   │   └── route.ts
│   │   ├── nodes/
│   │   │   └── route.ts
│   │   └── edges/
│   │       └── route.ts
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── dropdown.tsx
│   │   └── card.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── project-card.tsx
│   │   ├── project-list.tsx
│   │   └── create-project-modal.tsx
│   ├── canvas/
│   │   ├── canvas-editor.tsx     # Main React Flow wrapper
│   │   ├── canvas-toolbar.tsx    # Top toolbar (add node, zoom controls)
│   │   ├── canvas-sidebar.tsx    # Right sidebar for node details
│   │   ├── nodes/
│   │   │   ├── pillar-node.tsx
│   │   │   ├── cluster-node.tsx
│   │   │   ├── planned-node.tsx
│   │   │   └── external-node.tsx
│   │   ├── edges/
│   │   │   ├── hierarchy-edge.tsx
│   │   │   ├── internal-link-edge.tsx
│   │   │   └── planned-link-edge.tsx
│   │   └── panels/
│   │       ├── node-edit-panel.tsx
│   │       └── minimap-panel.tsx
│   └── layout/
│       ├── header.tsx
│       └── footer.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   ├── store/
│   │   ├── canvas-store.ts       # Zustand store for canvas state
│   │   └── project-store.ts      # Zustand store for project data
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── constants.ts
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── hooks/
│   ├── use-projects.ts           # Project CRUD hooks
│   ├── use-nodes.ts              # Node CRUD hooks
│   ├── use-edges.ts              # Edge CRUD hooks
│   └── use-canvas.ts             # Canvas interaction hooks
├── public/
│   └── images/
├── middleware.ts                 # Next.js middleware for auth
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## TypeScript Type Definitions

```typescript
// lib/types/index.ts

// Database row types (match Supabase schema)
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export type NodeType = 'pillar' | 'cluster' | 'planned' | 'external';
export type NodeStatus = 'planned' | 'writing' | 'published' | 'needs_update';

export interface ContentNode {
  id: string;
  project_id: string;
  node_type: NodeType;
  title: string;
  slug: string | null;
  url: string | null;
  target_keyword: string | null;
  status: NodeStatus;
  notes: string | null;
  word_count_target: number | null;
  assigned_to: string | null;
  publish_date: string | null;
  position_x: number;
  position_y: number;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export type EdgeType = 'hierarchy' | 'internal_link' | 'planned_link' | 'external_link';

export interface ContentEdge {
  id: string;
  project_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: EdgeType;
  label: string | null;
  created_at: string;
}

export interface CanvasSettings {
  id: string;
  project_id: string;
  viewport_x: number;
  viewport_y: number;
  viewport_zoom: number;
  show_labels: boolean;
  snap_to_grid: boolean;
  grid_size: number;
  updated_at: string;
}

// React Flow adapted types
export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Omit<ContentNode, 'id' | 'position_x' | 'position_y'>;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  data: Omit<ContentEdge, 'id' | 'source_node_id' | 'target_node_id'>;
}

// Form types
export interface CreateProjectInput {
  name: string;
  description?: string;
  website_url?: string;
  color?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

export interface CreateNodeInput {
  project_id: string;
  node_type: NodeType;
  title: string;
  position_x: number;
  position_y: number;
  target_keyword?: string;
  status?: NodeStatus;
}

export interface UpdateNodeInput extends Partial<Omit<CreateNodeInput, 'project_id'>> {
  id: string;
}

export interface CreateEdgeInput {
  project_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: EdgeType;
  label?: string;
}
```

---

## Core Features Specification

### F1: Authentication

**Description:** User signup, login, logout with email/password via Supabase Auth.

**User Stories:**
- As a visitor, I can sign up with my email and password
- As a user, I can log in to access my projects
- As a user, I can log out securely
- As a user, I can reset my password if forgotten

**Implementation Notes:**
- Use Supabase Auth UI components or build custom forms
- Protect dashboard routes with middleware
- Store session in cookies for SSR compatibility

### F2: Project Management (Dashboard)

**Description:** CRUD operations for projects from a central dashboard.

**User Stories:**
- As a user, I can see all my projects in a grid/list view
- As a user, I can create a new project with name and optional description
- As a user, I can edit project details
- As a user, I can delete a project (with confirmation)
- As a user, I can see project metadata (node count, last updated)

**UI Components:**
- Project card with thumbnail, name, stats
- Create project modal
- Edit project modal
- Delete confirmation modal

### F3: Canvas Editor

**Description:** Interactive node-based canvas for visualizing content architecture.

**User Stories:**
- As a user, I can pan the canvas by dragging
- As a user, I can zoom in/out using mouse scroll or buttons
- As a user, I can fit all content to view with a button
- As a user, I can see a minimap for navigation
- As a user, canvas viewport persists when I return

**Implementation Notes:**
- Use React Flow with custom node types
- Save viewport position on change (debounced)
- Load saved viewport on mount

### F4: Node Management

**Description:** Create, edit, delete, and position content nodes.

**User Stories:**
- As a user, I can add a new node by clicking a button or context menu
- As a user, I can choose node type (Pillar, Cluster, Planned, External)
- As a user, I can drag nodes to reposition them
- As a user, I can click a node to view/edit its details in a sidebar
- As a user, I can delete a node (edges auto-delete)
- As a user, I can change node status with a dropdown
- As a user, nodes have distinct visual styles by type and status

**Node Visual Differentiation:**

| Type | Shape | Default Color | Border |
|------|-------|---------------|--------|
| Pillar | Large rectangle | Indigo | Solid thick |
| Cluster | Medium rectangle | Blue | Solid |
| Planned | Medium rectangle | Gray | Dashed |
| External | Small circle | Green | Solid |

| Status | Visual Indicator |
|--------|------------------|
| Planned | Dashed border, muted color |
| Writing | Pulsing indicator, yellow accent |
| Published | Solid border, full color |
| Needs Update | Orange warning badge |

### F5: Edge Management

**Description:** Create and delete connections between nodes.

**User Stories:**
- As a user, I can connect two nodes by dragging from source handle to target
- As a user, I can choose connection type when creating
- As a user, I can delete a connection by selecting and pressing delete
- As a user, edges have distinct visual styles by type

**Edge Visual Differentiation:**

| Type | Style | Color |
|------|-------|-------|
| Hierarchy | Thick solid | Indigo |
| Internal Link | Medium solid with arrow | Blue |
| Planned Link | Dashed with arrow | Gray |
| External Link | Dotted | Green |

### F6: Node Detail Panel

**Description:** Sidebar panel for viewing and editing node details.

**User Stories:**
- As a user, clicking a node opens its details in a right sidebar
- As a user, I can edit all node fields inline
- As a user, I can see incoming and outgoing links
- As a user, changes save automatically (debounced)

**Fields:**
- Title (required)
- Slug
- Full URL
- Target keyword
- Status (dropdown)
- Notes (textarea)
- Word count target
- Assigned to
- Publish date (date picker)

### F7: Toolbar and Controls

**Description:** Top toolbar with canvas actions and filters.

**User Stories:**
- As a user, I can add nodes via toolbar buttons
- As a user, I can zoom in/out/fit with buttons
- As a user, I can toggle grid snap
- As a user, I can filter visible nodes by type or status
- As a user, I can search nodes by title

**Toolbar Layout:**
```
[+ Add Node ▼] [Zoom -] [100%] [Zoom +] [Fit] | [Filter ▼] [Search...]
```

---

## API Routes

### Projects

```typescript
// app/api/projects/route.ts

// GET /api/projects - List user's projects
// POST /api/projects - Create new project

// app/api/projects/[id]/route.ts

// GET /api/projects/[id] - Get single project with nodes and edges
// PATCH /api/projects/[id] - Update project
// DELETE /api/projects/[id] - Delete project
```

### Nodes

```typescript
// app/api/nodes/route.ts

// POST /api/nodes - Create new node

// app/api/nodes/[id]/route.ts

// PATCH /api/nodes/[id] - Update node
// DELETE /api/nodes/[id] - Delete node

// app/api/nodes/batch/route.ts

// PATCH /api/nodes/batch - Update multiple nodes (for position changes)
```

### Edges

```typescript
// app/api/edges/route.ts

// POST /api/edges - Create new edge

// app/api/edges/[id]/route.ts

// DELETE /api/edges/[id] - Delete edge
```

---

## Zustand Store Structure

```typescript
// lib/store/canvas-store.ts

import { create } from 'zustand';
import { Node, Edge, Viewport } from 'reactflow';

interface CanvasState {
  // Data
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  
  // UI state
  selectedNodeId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setViewport: (viewport: Viewport) => void;
  
  // Sync actions
  saveNodesToDb: () => Promise<void>;
  loadProjectData: (projectId: string) => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeId: null,
  isLoading: false,
  isSaving: false,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  addNode: (node) => set((state) => ({ 
    nodes: [...state.nodes, node] 
  })),
  
  updateNode: (id, data) => set((state) => ({
    nodes: state.nodes.map((n) => 
      n.id === id ? { ...n, ...data } : n
    ),
  })),
  
  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== id),
    edges: state.edges.filter(
      (e) => e.source !== id && e.target !== id
    ),
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
  })),
  
  addEdge: (edge) => set((state) => ({ 
    edges: [...state.edges, edge] 
  })),
  
  deleteEdge: (id) => set((state) => ({
    edges: state.edges.filter((e) => e.id !== id),
  })),
  
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setViewport: (viewport) => set({ viewport }),
  
  // Implement DB sync methods...
}));
```

---

## UI/UX Specifications

### Color Palette (Tailwind)

```javascript
// tailwind.config.js theme extension

colors: {
  // Node type colors
  pillar: {
    bg: '#EEF2FF',      // indigo-50
    border: '#6366F1',  // indigo-500
    text: '#3730A3',    // indigo-800
  },
  cluster: {
    bg: '#EFF6FF',      // blue-50
    border: '#3B82F6',  // blue-500
    text: '#1E40AF',    // blue-800
  },
  planned: {
    bg: '#F9FAFB',      // gray-50
    border: '#9CA3AF',  // gray-400
    text: '#374151',    // gray-700
  },
  external: {
    bg: '#ECFDF5',      // green-50
    border: '#10B981',  // green-500
    text: '#065F46',    // green-800
  },
  
  // Status colors
  status: {
    planned: '#9CA3AF',     // gray-400
    writing: '#FBBF24',     // amber-400
    published: '#10B981',   // green-500
    needsUpdate: '#F97316', // orange-500
  },
}
```

### Responsive Breakpoints

- **Desktop (primary):** 1024px+ (full canvas experience)
- **Tablet:** 768px-1023px (collapsible sidebar)
- **Mobile:** <768px (view-only mode with limited editing)

### Key UI Components

**1. Dashboard Project Card**
```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐    │
│  │      Canvas Preview         │    │
│  │        (thumbnail)          │    │
│  └─────────────────────────────┘    │
│  Project Name                       │
│  12 nodes · Updated 2 days ago      │
│  [Edit] [Open] [···]                │
└─────────────────────────────────────┘
```

**2. Canvas Node (Pillar)**
```
┌─────────────────────────────────────┐
│ ● [Published]                       │
│                                     │
│   Ultimate Guide to Technical SEO   │
│                                     │
│   🎯 technical seo                  │
│   🔗 8 in · 3 out                   │
└─────────────────────────────────────┘
```

**3. Node Detail Sidebar**
```
┌──────────────────────┐
│ × Node Details       │
├──────────────────────┤
│ Title                │
│ [________________]   │
│                      │
│ Type        Status   │
│ [Pillar ▼] [Pub.. ▼] │
│                      │
│ Target Keyword       │
│ [________________]   │
│                      │
│ URL                  │
│ [________________]   │
│                      │
│ Notes                │
│ [                ]   │
│ [                ]   │
│                      │
│ ─── Links ────────   │
│ Incoming (8)         │
│  · Cluster Article 1 │
│  · Cluster Article 2 │
│                      │
│ Outgoing (3)         │
│  · External Site     │
│                      │
│ [Delete Node]        │
└──────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goals:** Basic app shell, auth, and project CRUD.

**Tasks:**
1. Initialize Next.js project with TypeScript and Tailwind
2. Set up Supabase project and configure client
3. Create database tables and RLS policies
4. Implement authentication (signup, login, logout)
5. Build dashboard layout with sidebar
6. Build project list page with create/edit/delete

**Deliverables:**
- User can sign up, log in, log out
- User can create, view, edit, delete projects
- Dashboard shows all user projects

### Phase 2: Canvas Core (Week 2)

**Goals:** Interactive canvas with node rendering.

**Tasks:**
1. Set up React Flow with custom theme
2. Create custom node components (Pillar, Cluster, Planned, External)
3. Implement node creation via toolbar
4. Implement node positioning (drag and drop)
5. Implement node selection and deletion
6. Add zoom, pan, fit-to-view controls
7. Add minimap
8. Persist node positions to database

**Deliverables:**
- User can add nodes to canvas
- User can drag nodes to reposition
- User can zoom and pan canvas
- Node positions persist

### Phase 3: Connections and Details (Week 3)

**Goals:** Edge creation and node detail editing.

**Tasks:**
1. Create custom edge components
2. Implement edge creation (drag handles)
3. Implement edge deletion
4. Build node detail sidebar panel
5. Implement inline editing for all node fields
6. Add auto-save with debounce
7. Show link counts on nodes

**Deliverables:**
- User can connect nodes with edges
- User can edit node details in sidebar
- Changes auto-save

### Phase 4: Polish and UX (Week 4)

**Goals:** Refinement, filters, and quality of life.

**Tasks:**
1. Add node filtering by type and status
2. Add node search
3. Implement keyboard shortcuts (delete, escape)
4. Add undo/redo for canvas actions
5. Add empty states and loading states
6. Add error handling and toasts
7. Mobile responsive adjustments
8. Performance optimization (virtualization if needed)

**Deliverables:**
- Polished, production-ready MVP
- Good UX with feedback and error handling
- Usable on tablet (limited mobile)

---

## Future Enhancements (Post-MVP)

These are out of scope for MVP but documented for future reference:

1. **Import/Export**
   - Export to CSV/JSON
   - Export canvas as PNG/SVG
   - Import from CSV

2. **Collaboration**
   - Share project with team members
   - Real-time collaborative editing
   - Comments on nodes

3. **Integrations**
   - Google Search Console data pull
   - Google Analytics metrics
   - Ahrefs/SEMrush keyword data
   - WordPress/CMS sync

4. **Advanced Visualization**
   - Auto-layout algorithms
   - Cluster grouping
   - Link strength visualization
   - Traffic heatmaps

5. **Audit Features**
   - Broken link detection
   - Orphan page detection
   - Missing internal link suggestions
   - Content gap analysis

6. **Templates**
   - Starter silo templates
   - Industry-specific templates

---

## Environment Variables

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For server-side operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/ssr": "^0.1.0",
    "reactflow": "^11.10.0",
    "zustand": "^4.4.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first project created | < 2 minutes |
| Time to add 10 nodes with connections | < 5 minutes |
| Canvas interaction latency | < 100ms |
| Initial page load | < 2 seconds |
| User retention (week 1) | > 40% |

---

## Glossary

| Term | Definition |
|------|------------|
| **Pillar Content** | Comprehensive, authoritative hub page covering a broad topic |
| **Cluster Content** | Supporting articles that link to and from pillar content |
| **Silo** | A group of related content organized around a pillar |
| **Internal Link** | Hyperlink between pages on the same website |
| **Topical Authority** | Perceived expertise on a subject based on content depth |
| **Content Architecture** | The structure and organization of website content |

---

## Appendix: React Flow Node Example

```tsx
// components/canvas/nodes/pillar-node.tsx

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText, Link, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

interface PillarNodeData {
  title: string;
  target_keyword: string | null;
  status: 'planned' | 'writing' | 'published' | 'needs_update';
  incomingLinks: number;
  outgoingLinks: number;
}

const statusStyles = {
  planned: 'border-dashed border-gray-400 bg-gray-50',
  writing: 'border-solid border-amber-400 bg-amber-50',
  published: 'border-solid border-indigo-500 bg-indigo-50',
  needs_update: 'border-solid border-orange-400 bg-orange-50',
};

const statusLabels = {
  planned: 'Planned',
  writing: 'Writing',
  published: 'Published',
  needs_update: 'Needs Update',
};

function PillarNode({ data, selected }: NodeProps<PillarNodeData>) {
  return (
    <div
      className={clsx(
        'px-4 py-3 rounded-lg border-2 min-w-[220px] max-w-[280px]',
        'shadow-sm transition-shadow',
        statusStyles[data.status],
        selected && 'ring-2 ring-indigo-500 ring-offset-2'
      )}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
      
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-indigo-500" />
        <span className="text-xs font-medium text-indigo-700">
          {statusLabels[data.status]}
        </span>
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2">
        {data.title}
      </h3>
      
      {/* Keyword */}
      {data.target_keyword && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
          <FileText className="w-3 h-3" />
          <span className="truncate">{data.target_keyword}</span>
        </div>
      )}
      
      {/* Link counts */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Link className="w-3 h-3" />
          {data.incomingLinks} in
        </span>
        <span className="flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          {data.outgoingLinks} out
        </span>
      </div>
    </div>
  );
}

export default memo(PillarNode);
```

---

## End of Document

This PRD provides complete specifications for building the SEO Content Architect MVP. The AI agent should follow the implementation phases in order, referring to the relevant sections for database schema, types, folder structure, and component specifications as needed.
