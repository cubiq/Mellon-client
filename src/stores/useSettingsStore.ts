import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const LEFT_PANEL_WIDTH_MIN = 240;
const RIGHT_PANEL_WIDTH_MIN = 320;

interface SettingsState {
  isLeftPanelOpen: boolean;
  leftPanelWidth: number;
  leftPanelTabIndex: number;

  isRightPanelOpen: boolean;
  rightPanelWidth: number;

  executeButtonIndex: number;

  activeNodeGroups: string[];
  nodeGroupBy: 'module' | 'category';

  edgeType: 'default' | 'smoothstep';

  // values not saved to localStorage
  fileBrowserOpener: { nodeId: string, fieldKey: string, fileTypes: string[], path: string } | null;
  modelManagerOpener: { nodeId: string | null, fieldKey: string | null } | null;
  alertOpener: { title: string | null, message: string, confirmText: string | null, cancelText: string | null, onConfirm: () => void, onCancel?: () => void } | null;
}

interface SettingsActions {
  setLeftPanelOpen: (open: boolean) => void;
  setLeftPanelWidth: (width: number) => void;
  setLeftPanelTabIndex: (index: number) => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelWidth: (width: number) => void;

  setExecuteButtonIndex: (index: number) => void;

  setActiveNodeGroups: (group: string) => void;
  setNodeGroupBy: (by: 'module' | 'category') => void;

  setEdgeType: (type: 'default' | 'smoothstep') => void;

  setFileBrowserOpener: (opener: { nodeId: string, fieldKey: string, fileTypes: string[], path: string } | null) => void;
  setModelManagerOpener: (opener: { nodeId: string | null, fieldKey: string | null } | null) => void;
  setAlertOpener: (opener: { title: string | null, message: string, confirmText: string | null, cancelText: string | null, onConfirm: () => void, onCancel?: () => void } | null) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist((set, get) => ({
    // Initial state
    isLeftPanelOpen: false,
    leftPanelWidth: LEFT_PANEL_WIDTH_MIN,
    leftPanelTabIndex: -1,
    isRightPanelOpen: false,
    rightPanelWidth: RIGHT_PANEL_WIDTH_MIN,
    executeButtonIndex: 0,
    activeNodeGroups: [],
    nodeGroupBy: 'module',
    edgeType: 'default',
    fileBrowserOpener: null,
    modelManagerOpener: null,
    alertOpener: null,

    // Actions
    setLeftPanelOpen: (open: boolean) => set({ isLeftPanelOpen: open }),
    setLeftPanelWidth: (width: number) => set({ leftPanelWidth: Math.max(LEFT_PANEL_WIDTH_MIN, width) }),
    setLeftPanelTabIndex: (index: number) => set({ leftPanelTabIndex: index }),
    setRightPanelOpen: (open: boolean) => set({ isRightPanelOpen: open }),
    setRightPanelWidth: (width: number) => set({ rightPanelWidth: Math.max(RIGHT_PANEL_WIDTH_MIN, width) }),

    setExecuteButtonIndex: (index: number) => set({ executeButtonIndex: index }),

    setActiveNodeGroups: (group: string) => {
      const current = get().activeNodeGroups;
      if (current.includes(group)) {
        set({ activeNodeGroups: current.filter(g => g !== group) });
      } else {
        set({ activeNodeGroups: [...current, group] });
      }
    },

    setNodeGroupBy: (by: 'module' | 'category') => set({ nodeGroupBy: by }),

    setEdgeType: (type: 'default' | 'smoothstep') => set({ edgeType: type }),

    setFileBrowserOpener: (opener: { nodeId: string, fieldKey: string, fileTypes: string[], path: string } | null) => set({ fileBrowserOpener: opener }),
    setModelManagerOpener: (opener: { nodeId: string | null, fieldKey: string | null } | null) => set({ modelManagerOpener: opener }),
    setAlertOpener: (opener: { title: string | null, message: string, confirmText: string | null, cancelText: string | null, onConfirm: () => void, onCancel?: () => void } | null) => set({ alertOpener: opener }),
  }),
    {
      name: "settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { fileBrowserOpener, modelManagerOpener, alertOpener, ...rest } = state;
        return rest;
      },
    }
  )
);