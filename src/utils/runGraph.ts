import { enqueueSnackbar } from "notistack";
import config from "../../app.config";
import { useFlowStore } from "../stores/useFlowStore";

export const runGraph = async (sid: string, targetNodeId?: string) => {
    const graph = useFlowStore.getState().exportGraph(sid, targetNodeId);

    try {
        const response = await fetch(`${config.serverAddress}/graph`, {
            method: 'POST',
            body: JSON.stringify(graph),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        if (data.error) {
            enqueueSnackbar(data.message, { variant: 'error', autoHideDuration: data.message.length * 80 });
            return;
        }
        console.info(data.message);
    } catch (error) {
        const err = `Error exporting graph: ${error}`;
        enqueueSnackbar(err, { variant: 'error', autoHideDuration: err.length * 80 });
        console.error(err);
    }
}