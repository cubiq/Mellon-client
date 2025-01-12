import { createWithEqualityFn } from 'zustand/traditional';
import config from '../../config';

type NodeType = {
    [key: string]: {
        label: string
        module: string
        action: string
        category: string
        params?: { [key: string]: any }
    }
}

export type NodeRegistryState = {
    nodeRegistry: NodeType;
    updateNodeRegistry: () => Promise<void>;
}

export const useNodeRegistryState = createWithEqualityFn<NodeRegistryState>((set) => ({
    nodeRegistry: {},
    updateNodeRegistry: async () => {
        try {
            const response = await fetch('http://' + config.serverAddress + '/nodes')
            const data = await response.json()
            set({ nodeRegistry: data })
        } catch (error) {
            console.error('Can\'t connect to route `/nodes`', error)
        }
    },
}))