import { enqueueSnackbar } from "notistack";
import config from "../../app.config";
import { useWebsocketStore } from "../stores/useWebsocketStore";
import { useFlowStore } from "../stores/useFlowStore";

export default async function runFieldAction(nodeId: string, module: string, action: string, fn: string, fieldKey?: string, queue?: boolean) {
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