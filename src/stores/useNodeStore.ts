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
    min?: number;
    max?: number;
    step?: number;
    onChange?: any;
    dataSource?: any;
    fieldOptions?: Record<string, any>;
    style?: Record<string, any>;
}

type NodesStore = {
    nodesRegistry: Record<string, NodeData>
    isLoading: boolean
    instance: string
    error: string | null
    fetchNodes: () => Promise<void>
}

export const useNodesStore = create<NodesStore>()((set) => ({
    nodesRegistry: {},
    isLoading: false,
    instance: '',
    error: null,
    
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
}))