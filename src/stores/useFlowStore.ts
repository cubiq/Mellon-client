import { create } from 'zustand'
import { persist, createJSONStorage } from "zustand/middleware";
import { NodeData, NodeParams } from './useNodeStore'
import { nanoid } from 'nanoid'
import {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange,
    Connection,
    Viewport,
    getIncomers,
    getOutgoers
} from '@xyflow/react'

import config from '../../app.config'

export type CustomNodeType = Node<NodeData, NodeData['type']>
export interface CustomConnection extends Connection {
    edgeType?: 'default' | 'smoothstep' | 'straight' | 'step' | string;
}

export type FlowStore = {
    nodes: CustomNodeType[];
    edges: Edge[];
    viewport: Viewport;
    lastExecutionTime: number;

    // events
    onNodesChange: OnNodesChange<CustomNodeType>;
    onEdgesChange: OnEdgesChange<Edge>;
    onConnect: (conn: CustomConnection) => void;

    // actions
    addNode: (node: CustomNodeType) => void;
    removeNodes: (ids: string | string[]) => void;
    removeEdges: (id: string | string[]) => void;
    clearWorkflow: () => void;
    getParam: (id: string, param: string, key: keyof NodeParams) => any;
    setParam: (id: string, param: string, value: any, key?: keyof NodeParams) => void;
    setNodeSize: (id: string, width: number, height: number) => void;
    getNodeParamsValues: (id: string) => Record<string, any>;
    replaceNodeParams: (id: string, params: Partial<NodeParams>) => void;
    setAllEdgesType: (edgeType: 'default' | 'smoothstep') => void;
    updateHandleConnectionStatus: () => void;
    groupNodes: (ids: string[]) => void;
    ungroupNodes: (id: string) => void;
    setViewport: (viewport: Viewport) => void;
    setNodeCached: (id: string, cached: boolean, memoryUsage?: Record<string, number>, executionTime?: Record<string, number>) => void;
    updateCacheStatus: (ids: string | string[]) => void;
    exportGraph: (sid: string, targetNodeId?: string) => APIGraphExport;
    updateProgress: (id: string, progress: number) => void;
    resetStatus: (cachedIds: string | string[]) => void;
    toObject: () => {
        nodes: CustomNodeType[];
        edges: Edge[];
        viewport: Viewport;
    };
}

type APINodeExport = {
    module: string;
    action: string;
    params: {
        [key: string]: {
            sourceId?: string;
            sourceKey?: string;
            value?: any;
            display?: string | string[];
            spawn?: boolean;
        }
    };
}

type APIGraphExport = {
    sid: string;
    nodes: { [key: string]: APINodeExport };
    paths: string[][];
}

export const useFlowStore = create<FlowStore>()(
    persist((set, get) => ({
        nodes: [],
        edges: [],
        viewport: {
            x: 0,
            y: 0,
            zoom: 1,
        },
        lastExecutionTime: 0,

        onNodesChange: async (changes: NodeChange<CustomNodeType>[]) => {
            const newNodes = applyNodeChanges(changes, get().nodes);
            set({ nodes: newNodes });

            // delete the server cache for the deleted nodes
            const deletedNodes = changes.filter(change => change.type === 'remove').map(change => change.id);
            if (deletedNodes.length > 0) {
                try {
                    const response = await fetch(`${config.serverAddress}/cache`, { method: 'DELETE', body: JSON.stringify({ nodes: deletedNodes }) });
                    if (!response.ok) {
                        throw new Error('Failed to delete cache');
                    }
                } catch (error) {
                    console.error('Failed to delete cache', error);
                }
            }
        },
        onEdgesChange: (changes: EdgeChange<Edge>[]) => {
            const removedEdges: Edge[] = [];
            changes.filter(change => change.type === 'remove').forEach(change => {
                const edge = get().edges.find(e => e.id === change.id);
                edge && removedEdges.push(edge);
                if (edge && edge.targetHandle) {
                    const node = get().nodes.find(n => n.id === edge.target);
                    if (!node) {
                        return;
                    }

                    // check if any field has to be converted from input to standard field
                    if (node.data.params?.[edge.targetHandle]?.isInput) {
                        get().setParam(node.id, edge.targetHandle, false, 'isInput');
                    }

                    // if it's a spawn handle, remove the spawned fields
                    if (node.data.params?.[edge.targetHandle]?.spawn) {
                        set({nodes: get().nodes.map(n => n.id === edge.target
                            ? { 
                                ...n, 
                                data: { 
                                    ...n.data, 
                                    params: Object.fromEntries(
                                        Object.entries(n.data.params).filter(([key]) => key !== edge.targetHandle)
                                    )
                                } 
                            }
                            : n)
                        });
                    }
                }
            });

            const newEdges = applyEdgeChanges(changes, get().edges);
            set({ edges: newEdges });
            if (removedEdges.length > 0) {
                get().updateHandleConnectionStatus();
            }
        },
        onConnect: (conn: CustomConnection) => {
            // Find existing edges that need to be removed (same target and targetHandle). Ie: only one connection per input handle
            const edgesToRemove = get().edges.filter(
                edge => edge.target === conn.target && edge.targetHandle === conn.targetHandle
            );
            // is this connection replacing an existing connection?
            const isReplace = edgesToRemove.length > 0;
            if (isReplace) {
                // remove replaced edges
                get().removeEdges(edgesToRemove.map(edge => edge.id));

                // Ensure the isConnected is updated for the replaced edges
                setTimeout(() => {
                    get().onConnect(conn);
                }, 0);
                return;
            }
            
            const sourceNode = get().nodes.find(n => n.id === conn.source);
            const handleType = sourceNode?.data.params?.[conn.sourceHandle || '']?.type || 'default';
            
            const newEdge = {
                ...conn,
                id: nanoid(),
                type: conn.edgeType || 'default',
                className: `category-${handleType}`,
            };
            // ^^ Add zIndex:1000 to move the edge above the node

            const targetNode = get().nodes.find(n => n.id === conn.target);
            // check if the target handle is a spawn handle
            const isSpawn = get().getParam(conn.target, conn.targetHandle!, 'spawn');

            if (targetNode && isSpawn && !isReplace) {
                const keyBaseName = conn.targetHandle!.split('>>>')[0];
                const spawnFields = Object.keys(targetNode.data.params).filter(key => key.startsWith(keyBaseName));
                // limit the number of spawn fields to 64
                if (spawnFields.length > 63) {
                    return;
                }
                const newKeyName = `${keyBaseName}>>>${nanoid(6)}`;
                const nodeParams = targetNode.data.params[conn.targetHandle!];
    
                // if the label is not set, use the key base name with uppercase first letter
                if (!nodeParams.label) {
                    nodeParams.label = keyBaseName.charAt(0).toUpperCase() + keyBaseName.slice(1);
                }
    
                // reorder the params so the spawned fields are grouped together
                const newParams: { [key: string]: NodeParams } = {};
                Object.entries(targetNode.data.params).forEach(([key, value]) => {
                    newParams[key] = value;
                    if (key === conn.targetHandle) {
                        newParams[newKeyName] = {...nodeParams };
                    }
                });
                set({ nodes: get().nodes.map(n => n.id === targetNode.id ? { ...n, data: { ...n.data, params: newParams } } : n) });
            }

            // Add the new edge to the current edges
            set({ edges: [...get().edges, newEdge] });
            get().updateHandleConnectionStatus();
        },
        updateHandleConnectionStatus: () => {
            const edges = get().edges;

            // filter nodes that have a source or target connection
            get().nodes.map(node => {
                Object.keys(node.data.params)
                    .filter(k => node.data.params[k].display === 'input' || node.data.params[k].display === 'output')
                    .forEach(key => {
                        const param = node.data.params[key];
                        let isConnected = false;
                        if (param.display === 'input') {
                            isConnected = edges.some(e => e.target === node.id && e.targetHandle === key);
                        } else if (param.display === 'output') {
                            isConnected = edges.some(e => e.source === node.id && e.sourceHandle === key);
                        }
                        get().setParam(node.id, key, isConnected, 'isConnected');
                    });
                });
        },
        addNode: (node: CustomNodeType) => {
            set({ nodes: [...get().nodes, node] });
        },
        removeNodes: (ids: string | string[]) => {
            const idsArray = Array.isArray(ids) ? ids : [ids];
            set({ nodes: get().nodes.filter(n => !idsArray.includes(n.id)) });
            set({ edges: get().edges.filter(e => !idsArray.includes(e.source) && !idsArray.includes(e.target)) });
        },
        removeEdges: (ids: string | string[]) => {
            const changes: EdgeChange<Edge>[] = Array.isArray(ids)
                ? ids.map(id => ({ id, type: 'remove' }))
                : [{ id: ids, type: 'remove' }];
            get().onEdgesChange(changes);
        },
        clearWorkflow: () => {
            const nodeIds = get().nodes.map(n => n.id);

            // Update UI state immediately for instant feedback
            set({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 }, lastExecutionTime: 0 });

            // Delete cache from the server in the background (don't await)
            if (nodeIds.length > 0) {
                fetch(`${config.serverAddress}/cache`, { 
                    method: 'DELETE', 
                    body: JSON.stringify({ nodes: nodeIds }) 
                }).catch(error => {
                    console.error('Failed to delete cache', error);
                });
            }
        },
        getParam: (id: string, param: string, key: keyof NodeParams) => {
            const node = get().nodes.find(n => n.id === id);
            if (!node) return null;
            return node.data.params?.[param]?.[key];
        },
        setParam: (id: string, param: string, value: any, key?: keyof NodeParams) => {
            key = key || 'value';
            set((state) => {
                const node = state.nodes.find(n => n.id === id);
                if (!node) return state;

                // Create a new nodes array with the updated node
                const updatedNodes = state.nodes.map(n => {
                    if (n.id !== id) return n;
                    
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            params: {
                                ...n.data.params,
                                [param]: {
                                    ...n.data.params[param],
                                    [key]: value
                                }
                            }
                        }
                    };
                });

                return { nodes: updatedNodes };
            });
        },
        setNodeSize: (id: string, width: number, height: number) => {
            set((state) => {
                const node = state.nodes.find(n => n.id === id);
                if (!node) return state;
                return {
                    nodes: state.nodes.map(n => n.id === id ? { ...n, width, height } : n)
                };
            });
        },
        getNodeParamsValues: (id: string) => {
            const node = get().nodes.find(n => n.id === id);
            if (!node) return {};
            return Object.fromEntries(
                Object.entries(node.data.params)
                    .filter(([_key, value]) => {
                        const display = value.display;
                        // TODO: include input and output params by following the connections
                        return display !== 'input' && display !== 'output';
                    })
                    .map(([key, value]) => [key, value.value ?? value.default])
            );
            //return Object.fromEntries(Object.entries(node.data.params).map(([key, value]) => [key, value.value]));
        },
        replaceNodeParams: (id: string, params: Record<string, any>) => {
            // Get the current node to access its current params
            const currentNode = get().nodes.find(n => n.id === id);
            if (!currentNode) return;

            // Store edges that are connected to the node
            const connectedEdges = get().edges.filter(e => e.source === id || e.target === id);
            
            // Store connection information for handles that exist in both old and new params
            const preservedConnections: Edge[] = [];
            
            connectedEdges.forEach(edge => {
                // Check if the handle still exists in the new params
                const handleName = edge.source === id ? edge.sourceHandle : edge.targetHandle;
                if (handleName && params[handleName]) {
                    // This handle still exists, preserve the connection
                    preservedConnections.push(edge);
                }
            });

            // Remove all edges connected to the node
            get().removeEdges(connectedEdges.map(e => e.id));

            // Update the node params
            set((state) => {
                const node = state.nodes.find(n => n.id === id);
                if (!node) return state;
                return { nodes: state.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, params } } : n) };
            });

            // Recreate connections for handles that still exist
            preservedConnections.forEach(edge => {
                const connection: CustomConnection = {
                    source: edge.source,
                    target: edge.target,
                    sourceHandle: edge.sourceHandle || null,
                    targetHandle: edge.targetHandle || null,
                    edgeType: edge.type as 'default' | 'smoothstep' | 'straight' | 'step' | string
                };
                get().onConnect(connection);
            });
        },
        setAllEdgesType: (edgeType: 'default' | 'smoothstep') => {
            set((state) => {
                const updatedEdges = state.edges.map(edge => ({
                    ...edge,
                    type: edgeType
                }));
                return { edges: updatedEdges };
            });
        },
        groupNodes: (ids: string[]) => {
            set((state) => {
                const nodes = state.nodes.filter(n => ids.includes(n.id));
                if (nodes.length === 0) return state;

                const minX = Math.min(...nodes.map(n => n.position.x));
                const minY = Math.min(...nodes.map(n => n.position.y));
                const maxX = Math.max(...nodes.map(n => n.position.x + (n.measured?.width ?? 0)));
                const maxY = Math.max(...nodes.map(n => n.position.y + (n.measured?.height ?? 0)));

                const groupNode: CustomNodeType = {
                    id: nanoid(),
                    type: 'group',
                    width: maxX - minX + 40,
                    height: maxY - minY + 40,
                    data: {
                        type: 'group',
                        label: 'Group',
                        category: 'group',
                        module: '',
                        action: '',
                        params: {},
                    },
                    position: {
                        x: minX - 20,
                        y: minY - 20,
                    },
                };

                const updatedNodes = state.nodes.map(n => {
                    if (ids.includes(n.id)) {
                        return {
                            ...n,
                            parentId: groupNode.id,
                            position: {
                                x: n.position.x - minX + 20,
                                y: n.position.y - minY + 20,
                            },
                            extent: 'parent' as const
                        };
                    }
                    return n;
                });

                return { nodes: [groupNode, ...updatedNodes] };
            });
        },
        ungroupNodes: (id: string) => {
            set((state) => {
                const nodes = state.nodes.filter(n => n.id !== id);
                return { nodes };
            });
        },
        setViewport: (viewport: Viewport) => {
            set({ viewport });
        },

        setNodeCached: (id: string, isCached: boolean, memoryUsage?: Record<string, number>, executionTime?: Record<string, number>) => {
            set((state) => {
                const node = state.nodes.find(n => n.id === id);
                if (!node) return state;
                return {
                    nodes: state.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, isCached, memoryUsage: !isCached ? undefined : memoryUsage || n.data.memoryUsage || {}, executionTime: !isCached ? undefined : executionTime || n.data.executionTime || {} } } : n)
                };
            });
        },

        updateCacheStatus: (ids: string | string[]) => {
            const cached = Array.isArray(ids) ? ids : [ids]
            // set all nodes in `cached` to true and all others to false
            set((state) => {
                return {
                    nodes: state.nodes.map(n => cached.includes(n.id) ? { ...n, data: { ...n.data, isCached: true } } : { ...n, data: { ...n.data, isCached: false } })
                };
            });
        },

        exportGraph: (sid: string, targetNodeId?: string) => {
            const { nodes, edges } = get();
            const sessionId = sid || '';
            
            // Filter out group nodes and nodes without module/action
            const executableNodes = nodes.filter(node => 
                node.data.type !== 'group' && 
                node.data.module && 
                node.data.action
            );
            
            if (executableNodes.length === 0) {
                return {
                    sid: sessionId,
                    nodes: {},
                    paths: []
                };
            }
            
            // If targetNodeId is provided, validate it exists
            let targetNode: CustomNodeType | undefined;
            if (targetNodeId) {
                targetNode = executableNodes.find(node => node.id === targetNodeId);
                if (!targetNode) {
                    throw new Error(`Target node with id ${targetNodeId} not found in executable nodes`);
                }
            }
            
            // Helper function to get incoming nodes
            const getIncomingNodes = (nodeId: string): CustomNodeType[] => {
                const node = executableNodes.find(n => n.id === nodeId);
                if (!node) return [];
                return getIncomers(node, executableNodes, edges);
            };
            
            // Helper function to get outgoing nodes
            const getOutgoingNodes = (nodeId: string): CustomNodeType[] => {
                const node = executableNodes.find(n => n.id === nodeId);
                if (!node) return [];
                return getOutgoers(node, executableNodes, edges);
            };
            
            // Helper function to walk backwards from a node and collect all dependencies
            const walkBackwards = (nodeId: string, visited = new Set<string>()): string[] => {
                if (visited.has(nodeId)) {
                    return [];
                }
                
                visited.add(nodeId);
                
                // Get all incoming nodes (dependencies)
                const incomingNodes = getIncomingNodes(nodeId);
                
                // Recursively collect dependencies from incoming nodes
                const dependencies: string[] = [];
                for (const node of incomingNodes) {
                    dependencies.push(...walkBackwards(node.id, visited));
                }
                
                // Add current node after its dependencies
                dependencies.push(nodeId);
                
                return dependencies;
            };
            
            // Determine which nodes to include in the export
            let nodesToInclude: string[] = [];
            
            if (targetNodeId && targetNode) {
                // For partial export: only include nodes needed for the target node
                nodesToInclude = walkBackwards(targetNodeId);
            } else {
                // For full export: find output nodes and include all nodes in their paths
                const outputNodes = executableNodes.filter(node => {
                    const outgoers = getOutgoingNodes(node.id);
                    return outgoers.length === 0;
                });
                
                const endNodes = outputNodes.length > 0 ? outputNodes : executableNodes;
                
                // Collect all nodes from all paths
                const allPathNodes = new Set<string>();
                endNodes.forEach(node => {
                    const path = walkBackwards(node.id);
                    path.forEach(nodeId => allPathNodes.add(nodeId));
                });
                
                nodesToInclude = Array.from(allPathNodes);
            }
            
            // Filter executable nodes to only include those in the path
            const filteredExecutableNodes = executableNodes.filter(node => 
                nodesToInclude.includes(node.id)
            );
            
            // Build the nodes object for APIGraphExport
            const nodesExport: { [key: string]: APINodeExport } = {};
            
            filteredExecutableNodes.forEach((node) => {
                // Build params object for this node
                const params: APINodeExport['params'] = {};
                
                Object.entries(node.data.params || {}).forEach(([paramName, paramData]) => {
                    // skip output params
                    if (paramData.display === 'output') {
                        return;
                    }

                    // handle special random field
                    if (paramData.display === 'random') {
                        const fieldValue = typeof paramData.value === 'object' && 'value' in paramData.value
                            ? paramData.value.value
                            : paramData.value;
                        const isRandom = typeof paramData.value === 'object' && 'isRandom' in paramData.value
                            ? paramData.value.isRandom
                            : false;
                        if (isRandom) {
                            paramData.value = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
                            get().setParam(node.id, paramName, { value: paramData.value, isRandom });
                        } else {
                            paramData.value = fieldValue;
                        }
                    }

                    const param: APINodeExport['params'][string] = {
                        display: paramData.display,
                        value: paramData.value,
                    };
                    if (paramData.spawn) {
                        param.spawn = true;
                    }
                    
                    // Check if this parameter has incoming connections
                    // since inputs can only have one connection, we capture the single source
                    const incomingEdge = edges.find(edge => 
                        edge.target === node.id && 
                        edge.targetHandle === paramName
                    );
                    
                    if (incomingEdge) {
                        param.sourceId = incomingEdge.source;
                        param.sourceKey = incomingEdge.sourceHandle || undefined;
                    } else if (paramData.dataSource) {
                        param.sourceKey = paramData.dataSource;
                    }
                    
                    params[paramName] = param;
                });
                
                nodesExport[node.id] = {
                    module: node.data.module,
                    action: node.data.action,
                    params
                };
            });
            
            // Generate paths
            const paths: string[][] = [];
            
            if (targetNodeId && targetNode) {
                // For partial export: single path to the target node
                const path = walkBackwards(targetNodeId);
                if (path.length > 0) {
                    paths.push(path);
                }
            } else {
                // For full export: paths from all output nodes
                const outputNodes = executableNodes.filter(node => {
                    const outgoers = getOutgoingNodes(node.id);
                    return outgoers.length === 0;
                });
                
                const endNodes = outputNodes.length > 0 ? outputNodes : executableNodes;
                
                // Generate paths starting from each output node
                endNodes.forEach(node => {
                    const path = walkBackwards(node.id);
                    if (path.length > 0) {
                        paths.push(path);
                    }
                });
            }
            
            return {
                sid: sessionId,
                nodes: nodesExport,
                paths
            };
        },
        updateProgress: (id: string, progress: number) => {
            set((state) => {
                const node = state.nodes.find(n => n.id === id);
                if (!node) return state;
                return { nodes: state.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, progress } } : n) };
            });
        },
        resetStatus: (cachedIds: string | string[]) => {
            // reset the cache status for the given ids
            get().updateCacheStatus(cachedIds);

            // zero the progress for all nodes
            get().nodes.forEach(node => {
                if (node.data.progress && node.data.progress !== 0) {
                    get().updateProgress(node.id, 0);
                }
            });
        },
        toObject: () => {
            return {
                nodes: get().nodes,
                edges: get().edges,
                viewport: get().viewport
            };
        }
    }),
    {
        name: "reactflow",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
            nodes: state.nodes,
            edges: state.edges,
            viewport: state.viewport,
        }),
    })
)
