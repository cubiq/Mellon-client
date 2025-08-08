import { create } from 'zustand'
import config from '../../app.config'

export type NodeData = {
    type: 'custom' | 'any' | 'group';
    module: string;
    action: string;
    label: string;
    category: string;
    params: Record<string, NodeParams>;
    description?: string;
    style?: string;
    resizable?: boolean;
    executionTime?: Record<string, number>;
    memoryUsage?: Record<string, number>;
    isCached?: boolean;
    progress?: number;
    minimized?: boolean;
}

export type NodeParams = {
    type?: string | string[];
    display?: string;
    label?: string;
    value?: any;
    default?: any;
    description?: string;
    disabled?: boolean;
    hidden?: boolean;
    isInput?: boolean;
    isConnected?: boolean;
    spawn?: boolean;
    options?: any[] | Record<string | number | symbol, any>;
    optionsSource?: Record<string, any>;
    min?: number;
    max?: number;
    step?: number;
    onChange?: any;
    onSignal?: any;
    signal?: { direction: 'input' | 'output'; origin?: string; value: any; };
    dataSource?: any;
    fieldOptions?: Record<string, any>;
    style?: Record<string, any>;
}

type NodesStore = {
    nodesRegistry: Record<string, NodeData>
    isLoading: boolean
    instance: string
    error: string | null
    hfCache: any[]
    localModels: any[]
    fetchNodes: () => Promise<void>
    fetchHfCache: (refresh?: boolean) => Promise<void>
    fetchLocalModels: (refresh?: boolean) => Promise<void>
    fetchRegistry: () => Promise<void>
}

export const useNodesStore = create<NodesStore>()((set, get) => ({
    nodesRegistry: {},
    isLoading: false,
    instance: '',
    error: null,
    hfCache: [],
    localModels: [],
    fetchNodes: async () => {
        set({ isLoading: true, error: null })
        try {
            const response = await fetch(`${config.serverAddress}/nodes`)
            const data = await response.json()
            set({ nodesRegistry: data.nodes, instance: data.instance, isLoading: false })
        } catch (error) {
            const message = `Server ${config.serverAddress} is not responding. Check if the server is running and the address is correct.`
            set({ error: message, isLoading: false })
            //console.error(error)
        }
    },

    fetchHfCache: async (refresh: boolean = false) => {
        if (get().error) {
            return
        }
        set({ isLoading: true, error: null })
        try {
            const response = await fetch(`${config.serverAddress}/hf_cache?compact=1&refresh=${refresh}`, {
                method: 'GET',
            })
            const data = await response.json()
            set({ hfCache: data, isLoading: false })
        } catch (error) {
            set({ error: 'Error fetching Hugging Face cache. Check if the server is running and try to reload the page.', isLoading: false })
        }
    },

    fetchLocalModels: async (refresh: boolean = false) => {
        if (get().error) {
            return
        }
        set({ isLoading: true, error: null })
        try {
            const response = await fetch(`${config.serverAddress}/local_models?refresh=${refresh}`, {
                method: 'GET',
            })
            const data = await response.json()
            set({ localModels: data, isLoading: false })
        } catch (error) {
            set({ error: 'Error getting the list of local models. Check if the server is running and try to reload the page.', isLoading: false })
        }
    },

    fetchRegistry: async () => {
        await get().fetchNodes()
        await get().fetchLocalModels()
        await get().fetchHfCache()
    }
}))