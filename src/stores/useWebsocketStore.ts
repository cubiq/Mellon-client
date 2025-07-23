import { create } from 'zustand'
import { nanoid } from 'nanoid'
import config from '../../app.config';

import { useFlowStore } from './useFlowStore';
import { useNodesStore } from './useNodeStore';
import { useTaskStore } from './useTaskStore';
import { useSettingsStore } from './useSettingsStore';
import { runGraph } from '../utils/runGraph';

export type WebsocketState ={
    address: string | null;
    sid: string | null;
    ws: WebSocket | null;
    isConnected: boolean;
    connectionTimer: NodeJS.Timeout | undefined;
    loopTimer: NodeJS.Timeout | undefined;
    reconnectAttempts: number;

    connect: () => void;
    disconnect: () => void;
}

export const useWebsocketStore = create<WebsocketState>((set, get) => ({
    address: null,
    sid: null,
    ws: null,
    isConnected: false,
    connectionTimer: undefined,
    loopTimer: undefined,
    reconnectAttempts: 0,

    connect: async () => {
        const timeout = get().connectionTimer;
        const loopTimer = get().loopTimer;
        if (timeout) {
            clearTimeout(timeout);
            set({ connectionTimer: undefined });
        }
        if (loopTimer) {
            clearTimeout(loopTimer);
            set({ loopTimer: undefined });
        }

        const curr_ws = get().ws;
        if (curr_ws && curr_ws.readyState !== WebSocket.CLOSED) {
            console.info('Websocket already connected');
            return;
        }

        const sid = get().sid || nanoid(10);
        const address = get().address || config.serverAddress.replace('http', 'ws');
        if (!address) {
            console.error('Cannot connect to websocket: No address provided');
            return;
        }

        // Create a new WebSocket instance
        const ws = new WebSocket(`${address}/ws?sid=${sid}`);
        set({ address, ws, sid, isConnected: false });

        ws.onopen = () => {
            const timeout = get().connectionTimer;
            const loopTimer = get().loopTimer;
            if (timeout) {
                clearTimeout(timeout);
                set({ connectionTimer: undefined });
            }
            if (loopTimer) {
                clearTimeout(loopTimer);
                set({ loopTimer: undefined });
            }
            set({ isConnected: true, reconnectAttempts: 0 });
            console.info('Websocket connected');
        }

        ws.onclose = () => {
            set({ ws: null, isConnected: false, connectionTimer: undefined });
            console.info('Websocket disconnected');
            // clear cache status
            useFlowStore.getState().updateCacheStatus([]);
            useSettingsStore.getState().setRunningState('one_shot');
            clearTimeout(get().connectionTimer);
            clearTimeout(get().loopTimer);
            const attempts = get().reconnectAttempts;
            const delay = 500 * (2 ** attempts) + Math.random() * 1000;
            // We retry 5 times, if that fails, we try to ping the server via http
            // this is to overcome the browser's websocket backoff mechanism
            if (attempts < 5) {
                const timeout = setTimeout(() => {
                    set({ reconnectAttempts: attempts + 1 });
                    get().connect();
                    console.info("Trying to reconnect...");
                }, delay);
                set({ connectionTimer: timeout });
            } else {
                const ping = () => {
                    const request = new XMLHttpRequest();
                    request.open('GET', `${config.serverAddress}/favicon.ico`, true);
                    request.send();
                    request.onload = () => {
                        // server should be alive, try to reconnect the websocket
                        get().connect();
                        set({ reconnectAttempts: 0, connectionTimer: undefined });
                    }
                    request.onerror = () => {
                        const timeout = setTimeout(() => {
                            ping();
                            console.info("Server is still offline. Trying to reconnect...");
                        }, 2000 + Math.random() * 1000);
                        set({ connectionTimer: timeout });
                    }
                }
                ping();
            }
        }

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const sid = get().sid;

            switch (message.type) {
                case 'welcome':
                    if (message.sid !== sid) {
                        set({ sid: message.sid });
                        console.info('Websocket sid changed');
                    }
                    const instance = message.instance ?? '';
                    if (instance !== useNodesStore.getState().instance) {
                        useNodesStore.getState().fetchNodes();
                        console.info('Server instance changed, fetching nodes');
                    }
                    const cached = message.cachedNodes ?? [];
                    useFlowStore.getState().resetStatus(cached);
                    break;
                case 'executed':
                    if (!message.node) {
                        console.error('Invalid websocket message: executed without node');
                        return;
                    }
                    useFlowStore.getState().setNodeCached(message.node, true, message.hasChanged ? message.memoryUsage : undefined, message.hasChanged ? message.executionTime : undefined);
                    useFlowStore.getState().updateProgress(message.node, 0);
                    //console.info(`Node ${message.node}, ${message.name}, executed in ${message.executionTime?.last ?? 0}ms`);
                    break;
                case 'graph_completed':
                    console.info('Graph completed in', message.executionTime, 'ms');
                    useFlowStore.getState().lastExecutionTime = message.executionTime ?? 0;
                    const runningState = useSettingsStore.getState().runningState;
                    const taskCount = useTaskStore.getState().taskCount;

                    if (runningState === 'loop' && sid !== null && taskCount === 1) {
                        const loopTimer = setTimeout(() => {
                            runGraph(sid);
                        }, 517); // don't fret, this is a completely arbitrary number
                        set({ loopTimer });
                    }
                    break;
                case 'error':
                    console.error('Websocket error', message.error);
                    break;
                case 'update_value':
                    if (!message.node || !message.key) {
                        console.error('Invalid websocket message: update_value without node or fieldkey');
                        return;
                    }
                    const value = message.value ?? null;
                    useFlowStore.getState().setParam(message.node, message.key, value);
                    break;
                case 'progress':
                    if (!message.node) {
                        console.error('Invalid websocket message: progress without node');
                        return;
                    }
                    useFlowStore.getState().updateProgress(message.node, message.progress ?? 0);
                    break;
                case 'task_queued':
                case 'task_cancelled':
                case 'task_started':
                case 'task_completed':
                    if (!message.queued && !message.current) {
                        console.error('Invalid task websocket message.');
                        return;
                    }
                    useTaskStore.getState().setTasks(message.current, message.queued);

                    if (message.type === 'task_completed' && message.sid === sid && message.args) {
                        //const values = Array.isArray(message.args) ? message.args[0]?.values ?? '' : '';
                        const args = Array.isArray(message.args) && message.args.length > 1 ? message.args[1] : null;
                        if (args===null) {
                            return;
                        }
                        if (args.queue) {
                            useFlowStore.getState().setParam(args.node, args.key, false, 'disabled');
                        }
                    }

                    break;
                case 'task_progress':
                    if (!message.task_id || !message.progress) {
                        console.error('Invalid websocket message: task_progress without task_id or progress');
                        return;
                    }
                    useTaskStore.getState().updateProgress(message.task_id, message.progress ?? 0);
                    break;
                case 'node_definition':
                    if (!message.node) {
                        console.error('Invalid websocket message: node_definition without node');
                        return;
                    }

                    //useNodesStore.getState().setNodeDefinition(message.node, message.definition);
                    // get module and action from the node with id message.node
                    const node = useFlowStore.getState().nodes.find(n => n.id === message.node);
                    if (!node) {
                        console.warn('The node is no longer in the graph');
                        return;
                    }
                    const nodeId = node.data.module + '.' + node.data.action;
                    const defaultDef = useNodesStore.getState().nodesRegistry[nodeId];
                    if (!defaultDef) {
                        console.warn('The node is no longer in the node registry');
                        return;
                    }

                    Object.keys(message.params).forEach((key: string) => {
                        message.params[key].value = message.params[key].value ?? message.params[key].default;
                    });

                    const newParams = { ...defaultDef.params, ...message.params };
                    Object.keys(defaultDef.params).forEach(key => {
                        if (key in node.data.params) {
                            newParams[key] = node.data.params[key];
                        }
                    });
                    useFlowStore.getState().replaceNodeParams(node.id, newParams);
                    break;
                case 'set_field_visibility':
                    if (!message.node || !message.fields) {
                        console.error('Invalid websocket message: set_field_visibility without node or fields');
                        return;
                    }
                    const visibility = message.fields as Record<string, boolean>;
                    Object.keys(visibility).forEach((key) => {
                        useFlowStore.getState().setParam(message.node, key, !visibility[key], 'hidden');
                    });
                    break;
                case 'set_field_value':
                    if (!message.node || !message.fields) {
                        console.error('Invalid websocket message: set_field_value without node or fields');
                        return;
                    }
                    const values = message.fields as Record<string, any>;
                    Object.keys(values).forEach((key) => {
                        useFlowStore.getState().setParam(message.node, key, values[key], 'value');
                    });
                    break;
                default:
                    console.warn('Unknown websocket message type', message.type);
                    break;
            }
        }
    },

    disconnect: () => {
        const timeout = get().connectionTimer;
        if (timeout) {
            clearTimeout(timeout);
        }
        const loopTimer = get().loopTimer;
        if (loopTimer) {
            clearTimeout(loopTimer);
        }

        set((state) => {
            if (state.ws) {
                state.ws.close();
            }
            return {
                ws: null,
                isConnected: false,
                connectionTimer: undefined,
                loopTimer: undefined,
                reconnectAttempts: 0
            };
        });
    },
}));