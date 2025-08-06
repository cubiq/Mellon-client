import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const LEFT_PANEL_WIDTH_MIN = 240;
const RIGHT_PANEL_WIDTH_MIN = 320;

export interface fileBrowserParams {
  nodeId: string;
  fieldKey: string;
  fileTypes: string[];
  path: string;
}

// values saved to localStorage
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
}

// values not saved to localStorage. TODO: make this a separate store?
interface SettingsStateVolatile {
  fileBrowserOpener: fileBrowserParams | null;
  //modelManagerOpener: { nodeId: string, fieldKey: string, fileTypes: string[], path: string } | null;
  modelManagerOpener: { nodeId: string | null, fieldKey: string | null } | null;
  alertOpener: { title: string | null, message: string, confirmText: string | null, cancelText: string | null, onConfirm: () => void, onCancel?: () => void } | null;
  settingsOpener: boolean | null;
  runningState: 'one_shot' | 'auto_queue' | 'loop';
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

  setFileBrowserOpener: (opener: fileBrowserParams | null) => void;
  setModelManagerOpener: (opener: { nodeId: string | null, fieldKey: string | null } | null) => void;
  setAlertOpener: (opener: { title: string | null, message: string, confirmText: string | null, cancelText: string | null, onConfirm: () => void, onCancel?: () => void } | null) => void;
  setSettingsOpener: (opener: boolean | null) => void;
  setRunningState: (state: 'one_shot' | 'auto_queue' | 'loop') => void;

  resetToDefault: () => void;
}

const defaultState: SettingsState = {
  isLeftPanelOpen: false,
  leftPanelWidth: LEFT_PANEL_WIDTH_MIN,
  leftPanelTabIndex: -1,
  isRightPanelOpen: false,
  rightPanelWidth: RIGHT_PANEL_WIDTH_MIN,
  executeButtonIndex: 0,
  activeNodeGroups: [],
  nodeGroupBy: 'module',
  edgeType: 'default',
}

const defaultVolatileState: SettingsStateVolatile = {
  fileBrowserOpener: null,
  modelManagerOpener: null,
  alertOpener: null,
  settingsOpener: null,
  runningState: 'one_shot',
};

export const useSettingsStore = create<SettingsState & SettingsStateVolatile & SettingsActions>()(
  persist((set, get) => ({
    ...defaultState,
    ...defaultVolatileState,

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

    setFileBrowserOpener: (opener: fileBrowserParams | null) => set({ fileBrowserOpener: opener }),
    setModelManagerOpener: (opener: { nodeId: string | null, fieldKey: string | null } | null) => set({ modelManagerOpener: opener }),
    setAlertOpener: (opener: { title: string | null, message: string, confirmText: string | null, cancelText: string | null, onConfirm: () => void, onCancel?: () => void } | null) => set({ alertOpener: opener }),
    setSettingsOpener: (opener: boolean | null) => set({ settingsOpener: opener }),
    setRunningState: (state: 'one_shot' | 'auto_queue' | 'loop') => set({ runningState: state }),

    resetToDefault: () => set({...defaultState}),
  }),
    {
      name: "settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // remove the volatile keys from the state
        const persistedState: Partial<typeof state> = { ...state };
        const volatileKeys = Object.keys(defaultVolatileState) as (keyof SettingsStateVolatile)[];
        volatileKeys.forEach(key => delete persistedState[key]);

        // return the state without the volatile keys
        return persistedState as SettingsState;
      },
    }
  )
);
