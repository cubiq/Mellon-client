import {
    Edge,
    Node,
    OnConnect,
    NodeChange,
    EdgeChange,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
    Connection,
    getOutgoers,
    getIncomers,
} from '@xyflow/react';
import { createWithEqualityFn } from 'zustand/traditional';
import { nanoid } from 'nanoid';

import config from '../../config';

type NodeParams = {
    type?: string | string[];
    label?: string;
    display?: string;
    value?: any;
    options?: string | string[];
    default?: any;
    description?: string;
    source?: string;
    min?: number;
    max?: number;
    step?: number;
    group?: string | { [key: string]: string };
    style?: { [key: string]: string };
};

type NodeData = {
    module: string;
    action: string;
    category: string;
    params: { [key: string]: NodeParams };
    cache?: boolean;
    time?: number;
    memory?: number;
    label?: string;
    description?: string;
    style?: { [key: string]: string };
};

export type CustomNodeType = Node<NodeData, 'custom'>;

// Data format for API export
type APINodeData = {
    // TODO: we also need a workflow id probably
    module: string;
    action: string;
    params: {
        [key: string]: {
            sourceId?: string,
            sourceKey?: string,
            value?: any,
            display?: string,
            type?: string | string[]
        }
    };
};

type GraphExport = {
    sid: string;
    nodes: { [key: string]: APINodeData };
    paths: string[][];
};

const formatAPIData = (node: CustomNodeType, edge: Edge[]): APINodeData => {
    const inputEdges = edge.filter(e => e.target === node.id);
    const params: APINodeData['params'] = {};

    Object.entries(node.data.params).forEach(([key, param]) => {
        // We don't need to export output parameters
        if (param.display === 'output') {
            return;
        }

        const edge = inputEdges.find(e => e.targetHandle === key);

        params[key] = {
            sourceId: edge?.source ?? undefined,
            sourceKey: (edge ? edge.sourceHandle : param.source) ?? undefined,
            value: param.value ?? undefined,
            display: param.display ?? undefined,
            type: param.type ?? undefined
        };
    });

    return {
        module: node.data.module,
        action: node.data.action,
        params
    };
};

/*
const findOutputNode = (nodes: CustomNodeType[], edges: Edge[]): CustomNodeType[] => {
    const outputNodes = new Set(edges.map(edge => edge.source));
    return nodes.filter(node => !outputNodes.has(node.id));
};
*/

const buildPath = (
    currentNode: string,
    nodes: CustomNodeType[],
    edges: Edge[],
    visited: Set<string> = new Set()
): string[] => {
    if (visited.has(currentNode)) return []; // Prevent cycles
    visited.add(currentNode);

    // Get all incoming edges to this node
    //const incomingEdges = edges.filter(edge => edge.target === currentNode);
    const node = nodes.find(n => n.id === currentNode);
    if (!node) return [];
    
    const incomingNodes = getIncomers(node, nodes, edges);

    // If this is an input node (no incoming edges), return just this node
    if (incomingNodes.length === 0) {
        return [currentNode];
    }

    const inputPaths = incomingNodes.flatMap(sourceNode =>
        buildPath(sourceNode.id, nodes, edges, new Set(visited))
    );

    return [...inputPaths, currentNode];
};

export type NodeState = {
    nodes: CustomNodeType[];
    edges: Edge[];
    onNodesChange: OnNodesChange<CustomNodeType>;
    onEdgesChange: OnEdgesChange;
    onEdgeDoubleClick: (id: string) => void;
    onConnect: OnConnect;
    addNode: (node: CustomNodeType) => void;
    setParamValue: (id: string, key: string, value: any) => void;
    getParam: (id: string, param: string, key: keyof NodeParams) => any;
    setNodeExecuted: (id: string, cache: boolean, time: number, memory: number) => void;
    exportGraph: (sid: string) => GraphExport;
};

export const useNodeState = createWithEqualityFn<NodeState>((set, get) => ({
    nodes: [],
    edges: [],
    onNodesChange: async (changes: NodeChange<CustomNodeType>[]) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });

        // delete the server cache for the deleted nodes
        if (changes.some(change => change.type === 'remove')) {
            // Create an array of node ids to delete
            const nodeIds = changes.filter(change => change.type === 'remove').map(change => change.id);
            
            try {
                await fetch('http://' + config.serverAddress + '/clearNodeCache', {
                    method: 'DELETE',
                    body: JSON.stringify({ nodeId: nodeIds }),
                });
            } catch (error) {
                console.error('Can\'t connect to server to clear cache:', error);
                // TODO: should we retry?
            }
        }
    },
    onEdgesChange: (changes: EdgeChange<Edge>[]) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },
    onEdgeDoubleClick: (id: string) => {
      const updatedEdges = get().edges.filter((edge) => edge.id !== id);
      set({ edges: updatedEdges });
    },
    onConnect: (conn: Connection) => {
        const updatedEdges = get().edges.filter(
            edge => !(edge.target === conn.target && edge.targetHandle === conn.targetHandle)
        );
        const newEdge = { ...conn, id: nanoid() };
        set({ edges: [...updatedEdges, newEdge] });
    },
    addNode: (node: CustomNodeType) => {
        //const newNode = { ...node, dragHandle: 'header' };

        // Set initial value for all parameters, TODO: needed? default value should be exported by the server
        if (node.data?.params) {
            Object.keys(node.data.params).forEach(key => {
                const param = node.data.params[key];
                node.data.params[key] = {
                    ...param,
                    value: param.value ?? param.default
                };
            });
        }
        set({ nodes: [...get().nodes, node] });
    },
    setParamValue: (id: string, key: string, value: any) => {
        set({
            nodes: get().nodes.map((node) => (
                node.id === id
                ? {
                    ...node,
                    data: {
                        ...node.data,
                        params: {
                            ...node.data.params,
                            [key]: {
                                ...node.data.params[key],
                                value: value
                            }
                        }
                    }
                }
                : node
            )) // is this real life?
        });
    },
    getParam: (id: string, param: string, key: keyof NodeParams) => {
        const node = get().nodes.find(n => n.id === id);
        return node?.data.params[param][key];
    },
    setNodeExecuted: (id: string, cache: boolean, time: number, memory: number) => {
        set({ nodes: get().nodes.map(node => (node.id === id ? { ...node, data: { ...node.data, cache, time, memory } } : node)) });
    },
    exportGraph: (sid: string) => {
        const { nodes, edges } = get();
        const outputNodes = nodes.filter(node => getOutgoers(node, nodes, edges).length === 0); //findOutputNode(nodes, edges);
        const paths = outputNodes.map(node => buildPath(node.id, nodes, edges));

        const nodesLookup = nodes.reduce((acc, node) => ({
            ...acc,
            [node.id]: formatAPIData(node, edges)
        }), {});

        const graphData: GraphExport = {
            sid: sid ?? '',
            nodes: nodesLookup,
            paths
        };

        return graphData;
    }

}));
