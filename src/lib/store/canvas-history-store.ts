import { create } from 'zustand';
import { Node, Edge } from 'reactflow';

// Snapshot of canvas state at a point in time
export interface CanvasSnapshot {
    nodes: Node[];
    edges: Edge[];
    timestamp: number;
    action: string; // Description like "Added Node", "Deleted Link"
}

// Maximum number of history entries to keep
const MAX_HISTORY_SIZE = 50;

interface CanvasHistoryState {
    // History stacks
    past: CanvasSnapshot[];
    future: CanvasSnapshot[];

    // Current state reference (for pushing to history)
    currentSnapshot: CanvasSnapshot | null;

    // Actions
    setCurrentSnapshot: (nodes: Node[], edges: Edge[]) => void;
    pushState: (action: string) => void;
    undo: () => CanvasSnapshot | null;
    redo: () => CanvasSnapshot | null;
    clear: () => void;
}

export const useCanvasHistoryStore = create<CanvasHistoryState>((set, get) => ({
    past: [],
    future: [],
    currentSnapshot: null,

    // Set the current snapshot (called before actions that should be undoable)
    setCurrentSnapshot: (nodes: Node[], edges: Edge[]) => {
        set({
            currentSnapshot: {
                nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
                edges: JSON.parse(JSON.stringify(edges)), // Deep clone
                timestamp: Date.now(),
                action: '',
            },
        });
    },

    // Push current snapshot to history with action description
    pushState: (action: string) => {
        const { currentSnapshot, past } = get();

        if (!currentSnapshot) return;

        const snapshotWithAction = {
            ...currentSnapshot,
            action,
        };

        // Add to past, limit size, clear future
        const newPast = [...past, snapshotWithAction];
        if (newPast.length > MAX_HISTORY_SIZE) {
            newPast.shift(); // Remove oldest entry
        }

        set({
            past: newPast,
            future: [], // Clear redo stack on new action
            currentSnapshot: null,
        });
    },

    // Undo: pop from past, push current to future, return previous state
    undo: () => {
        const { past, future } = get();

        if (past.length === 0) return null;

        const newPast = [...past];
        const previousSnapshot = newPast.pop()!;

        set({
            past: newPast,
            future: [...future, previousSnapshot],
        });

        // Return the state to restore
        // If there's still history, return the new "current" (top of past)
        // If past is empty, this was the first action, so return the previousSnapshot
        // to show what was there before
        return previousSnapshot;
    },

    // Redo: pop from future, push to past, return next state
    redo: () => {
        const { past, future } = get();

        if (future.length === 0) return null;

        const newFuture = [...future];
        const nextSnapshot = newFuture.pop()!;

        set({
            past: [...past, nextSnapshot],
            future: newFuture,
        });

        return nextSnapshot;
    },

    // Clear all history (on project change, etc.)
    clear: () => {
        set({
            past: [],
            future: [],
            currentSnapshot: null,
        });
    },
}));

// Helper selectors
export const canUndo = () => useCanvasHistoryStore.getState().past.length > 0;
export const canRedo = () => useCanvasHistoryStore.getState().future.length > 0;
