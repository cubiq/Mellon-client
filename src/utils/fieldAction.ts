import { FieldProps } from "../components/NodeContent";
import { useFlowStore } from "../stores/useFlowStore";
import { useNodesStore } from "../stores/useNodeStore";
import { useWebsocketStore } from "../stores/useWebsocketStore";
import { enqueueSnackbar } from "notistack";
import config from "../../app.config";

export default async function fieldAction(props: FieldProps, value: any) {
    if (!props.onChange) {
        return;
    }

    let action = 'show';
    let data = props.onChange;

    if (typeof props.onChange === 'string') {
        action = 'exec';
    } else if ('action' in props.onChange && 'data' in props.onChange && ['show', 'hide', 'create', 'value', 'exec'].includes(props.onChange.action)) {
        action = props.onChange.action;
        data = props.onChange.data;
    }

    if (props.fieldType === 'input' && props.isConnected && props.onChange?.condition) {
        // follow the edge connection to get the output type
        console.log(props.nodeId, props.fieldKey);
        const edge = useFlowStore.getState().edges.find(e => e.target === props.nodeId && e.targetHandle === props.fieldKey);
        console.log(edge);
        if (edge && edge.targetHandle) {
            const sourceNode = useFlowStore.getState().nodes.find(n => n.id === edge.source);
            if (sourceNode) {
                const sourceField = sourceNode.data.params[edge.sourceHandle as string];
                if (sourceField) {
                    console.log(sourceField.type, props.onChange.condition["type"]);
                    if (sourceField.type === props.onChange.condition["type"]) {
                        console.log(sourceField.type);
                    }
                }
            }
        }
    }
    
    if (action === 'exec') {
        props.updateStore(props.fieldKey, true, 'disabled');
        try {
            await execAction(props.nodeId, props.module, props.action, data, props.fieldKey, props.fieldOptions?.queue || false);
        } catch (error) {
            props.updateStore(props.fieldKey, false, 'disabled');
        } finally {
            if (!props.fieldOptions?.queue) {
                props.updateStore(props.fieldKey, false, 'disabled');
            }
        }
    } else if (action === 'show' || action === 'hide') {
        Object.entries(data).forEach(([key, fields]: [string, any]) => {
            if (!Array.isArray(fields)) {
                fields = [fields];
            }

            const isHidden = action === 'show' ? key !== value : key === value;
            fields.forEach((field: string) => {
                props.updateStore(field, isHidden, 'hidden');
            });
        });
    } else if (action === 'create') {
        const node = useFlowStore.getState().nodes.find(n => n.id === props.nodeId);
        const defaultDef = useNodesStore.getState().nodesRegistry[`${props.module}.${props.action}`];
        if (!node || !defaultDef) {
            return;
        }
        
        const currData = data[value] || {};

        Object.keys(currData).forEach((key: string) => {
            currData[key].value = currData[key].value ?? currData[key].default;
        });

        const newParams = { ...defaultDef.params, ...currData };
        // for the default params, use the current node's params value
        Object.keys(defaultDef.params).forEach(key => {
            if (key in node.data.params) {
                newParams[key] = node.data.params[key];
            }
        });
        useFlowStore.getState().replaceNodeParams(props.nodeId, newParams);
        console.log(newParams);
    } else if (action === 'value') {
        //props.updateStore(props.fieldKey, props.onChange.data, 'value');
    }
}

async function execAction(nodeId: string, module: string, action: string, fn: string, fieldKey?: string, queue?: boolean) {
    const nodeValues = useFlowStore.getState().getNodeParamsValues(nodeId)
    
    try {
        const sid = useWebsocketStore.getState().sid;
        const response = await fetch(`${config.serverAddress}/fields/action`, {
            method: 'POST',
            body: JSON.stringify({ node: nodeId, sid, module, action, fn, values: nodeValues, fieldKey, queue }),
        });

        if (!response.ok) {
            enqueueSnackbar('Failed to run node action', { variant: 'error', autoHideDuration: 1500 });
            throw new Error('Failed to run node action');
        }

        const data = await response.json();
        if (data.error) {
            enqueueSnackbar(data.error, { variant: 'error', autoHideDuration: data.error.length * 80 });
            throw new Error(data.error);
        }
    } catch (error) {
        const err = `Error running node action: ${error}`;
        enqueueSnackbar(err, { variant: 'error', autoHideDuration: err.length * 80 });
        throw new Error(err);
    }
}