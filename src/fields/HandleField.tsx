import { Handle, Position, useUpdateNodeInternals } from "@xyflow/react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { FieldProps } from "../components/NodeContent";
import { useEffect } from "react";
import fieldAction, { relaySignal } from "../utils/fieldAction";

export default function HandleField(props: FieldProps) {
    const type = props.fieldType === 'output' ? 'source' : 'target';
    const position = props.fieldType === 'output' ? Position.Right : Position.Left;
    const textAlign = props.fieldType === 'output' ? 'right' : 'left';
    const updateNodeInternals = useUpdateNodeInternals();

    useEffect(() => {
        if (props.onChange) {
            fieldAction(props, (props.isConnected || false).toString());
            updateNodeInternals(props.nodeId);
        }
    }, [props.isConnected]);

    useEffect(() => {
        if (props.onSignal) {
            fieldAction(props, props.signal?.value, 'onSignal');
            updateNodeInternals(props.nodeId);
        }

        relaySignal(props.nodeId, props.fieldKey, props.signal);
    }, [props.signal]);


    return (
        <Box
            data-key={props.fieldKey}
            sx={{ position: 'relative', ...props.style }}
            className={`${props.disabled ? 'mellon-disabled' : ''} ${props.hidden && !props.isConnected ? 'mellon-hidden' : ''}`}
        >
            <Handle
                id={props.fieldKey}
                type={type}
                position={position}
                className={`${props.dataType}-handle`}
            />
            <Typography variant="body2" color="text.secondary" sx={{ px: 1, fontSize: '13px', mx: '2px', textAlign }}>
                {props.label}
            </Typography>
        </Box>
    );
}
