import { FieldProps } from "../components/NodeContent";
import { useFlowStore } from "../stores/useFlowStore";
import { useNodesStore } from "../stores/useNodeStore";
import { useWebsocketStore } from "../stores/useWebsocketStore";
import { enqueueSnackbar } from "notistack";
import config from "../../app.config";

export default async function fieldAction(props: FieldProps, value: any, event: string = 'onChange') {
    if (!props.onChange && event === 'onChange') {
        return;
    }
    if (!props.onSignal && event === 'onSignal') {
        return;
    }

    const onEvent = event === 'onChange' ? props.onChange : event === 'onSignal' ? props.onSignal : null;
    if (!onEvent) {
        return;
    }

    let action = 'show';
    let data = onEvent || {};
    const targetField = onEvent.target;

    const flowState = useFlowStore.getState();

    if (typeof data === 'string') {
        action = 'exec';
    } else if ('action' in onEvent && ['show', 'hide', 'create', 'value', 'exec', 'signal'].includes(onEvent.action)) {
        action = onEvent.action || 'show';
        if (onEvent.data) {
            data = onEvent.data;
        }
    }

    function getSourceHandleType() {
        // follow the edge connection to get the output type
        const edge = flowState.edges.find(e => e.target === props.nodeId && e.targetHandle === props.fieldKey);
        if (edge && edge.sourceHandle) {
            const sourceNode = flowState.nodes.find(n => n.id === edge.source);
            if (sourceNode) {
                const sourceField = sourceNode.data.params[edge.sourceHandle];
                if (sourceField) {
                    return sourceField.type;
                }
            }
        }

        return null;
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
        // This logic should be outside the loop as it should only be evaluated once.
        let valuesToCheck = value;
        
        // handle special case when a node is created with the input already connected
        if (event === 'onChange' && props.fieldType === 'input' && props.isConnected && onEvent.condition && onEvent.condition["type"] !== getSourceHandleType()) {
            valuesToCheck = valuesToCheck === 'true' ? 'false' : 'true';
        }

        valuesToCheck = Array.isArray(valuesToCheck) ? valuesToCheck : [valuesToCheck];

        const fieldVisibilityMap: Map<string, Set<string>> = new Map();

        for (const [key, fieldsData] of Object.entries(data)) {
            const fields = Array.isArray(fieldsData) ? fieldsData : [fieldsData];

            for (const field of fields) {
                if (!fieldVisibilityMap.has(field)) {
                    fieldVisibilityMap.set(field, new Set());
                }

                const requests = fieldVisibilityMap.get(field)!;
                if (valuesToCheck.includes(key)) {
                    if (action === 'show') {
                        requests.add(props.fieldKey);
                    } else { // action === 'hide'
                        requests.delete(props.fieldKey);
                    }
                }
            }
        }

        // Now update visibility based on aggregate requests
        for (const [field, requests] of fieldVisibilityMap.entries()) {
            const shouldShow = requests.size > 0;
            props.updateStore(field, !shouldShow, 'hidden');
        }
    } else if (action === 'create') {
        const node = flowState.nodes.find(n => n.id === props.nodeId);
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
        flowState.replaceNodeParams(props.nodeId, newParams);
    } else if (action === 'value') {
        const propKey = onEvent.prop || 'value';
        value = data ? data[value ?? ''] : value ?? '';

        if (!['value', 'hidden', 'disabled', 'options'].includes(propKey)) {
            return;
        }

        props.updateStore(targetField, value, propKey);

        if (propKey === 'options') {
            props.updateStore(targetField, true, 'disabled');
            const targetValue = flowState.getParam(props.nodeId, targetField, 'value');
            const normTargetValue = targetValue ? Array.isArray(targetValue) ? targetValue : [targetValue] : [];
            const validOptions = value ? Array.isArray(value) ? value.map(String) : Object.keys(value) : [];
            const filterValue = normTargetValue.filter((opt) => validOptions.includes(String(opt)));

            setTimeout(() => {
                props.updateStore(targetField, filterValue, 'value');
                // force a refresh by triggering the disabled state
                props.updateStore(targetField, false, 'disabled');
            }, 0);
        }
    } else if (action === 'signal') {
        // check if the target field is an input or output field
        if (!targetField) {
            return;
        }

        const targetFieldType = flowState.getParam(props.nodeId, targetField, 'display');
        if (!targetFieldType || (targetFieldType !== 'input' && targetFieldType !== 'output')) {
            return;
        }

        const signal = {
            direction: targetFieldType,
            origin: props.fieldKey,
            value: value,
        }

        props.updateStore(targetField, signal, 'signal');
    }
}

export function relaySignal(nodeId: string, fieldKey: string, signal: { direction: 'input' | 'output'; origin?: string; value: any } | undefined) {
    if (!signal) {
        return;
    }

    const flowState = useFlowStore.getState();

    if (signal.direction === 'output') {
        const outgoers = flowState.edges.filter(e => e.source === nodeId && e.sourceHandle === fieldKey);
        if (outgoers.length > 0) {
            outgoers.forEach(edge => {
                const targetNodeId = edge.target;
                const targetFieldKey = edge.targetHandle;
                if (targetNodeId && targetFieldKey) {
                    const targetSignal = flowState.getParam(targetNodeId, targetFieldKey, 'signal');
                    if (!targetSignal || targetSignal.origin === undefined) {
                        flowState.setParam(targetNodeId, targetFieldKey, { ...targetSignal, value: signal.value }, 'signal');
                    }
                }
            });
            return;
        }
    }

    if (signal.direction === 'input') {
        const incomer = flowState.edges.find(e => e.target === nodeId && e.targetHandle === fieldKey);
        if (incomer) {
            const sourceNodeId = incomer.source;
            const sourceFieldKey = incomer.sourceHandle;
            if (sourceNodeId && sourceFieldKey) {
                const sourceSignal = flowState.getParam(sourceNodeId, sourceFieldKey, 'signal');
                if (!sourceSignal || sourceSignal.origin === undefined) {
                    flowState.setParam(sourceNodeId, sourceFieldKey, { ...sourceSignal, value: signal.value }, 'signal');
                }
            }
        }
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