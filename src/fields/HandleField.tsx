import { Handle, Position } from "@xyflow/react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { FieldProps } from "../components/NodeContent";
import { useEffect } from "react";
import runFieldAction from "../utils/runFieldAction";

export default function HandleField(props: FieldProps) {
    const type = props.fieldType === 'output' ? 'source' : 'target';
    const position = props.fieldType === 'output' ? Position.Right : Position.Left;
    const textAlign = props.fieldType === 'output' ? 'right' : 'left';

    const fieldsToggle = async (value: boolean) => {
        if (typeof props.onChange === 'string') {
            props.updateStore(props.fieldKey, true, 'disabled');
            try {
                await runFieldAction(props.nodeId, props.module, props.action, props.onChange, props.fieldKey, props.fieldOptions?.queue || false);
            } catch (error) {
                props.updateStore(props.fieldKey, false, 'disabled');
            } finally {
                if (!props.fieldOptions?.queue) {
                    props.updateStore(props.fieldKey, false, 'disabled');
                }
            }
            return;
        }

        Object.entries(props.onChange).forEach(([key, fields]: [string, any]) => {
            if (!Array.isArray(fields)) {
                fields = [fields];
            }
            const isHidden = key === value.toString();
            fields.forEach((field: string) => {
                props.updateStore(field, isHidden, 'hidden');
            });
        });
    }
    useEffect(() => {
        if (!props.onChange) {
            return;
        }
        fieldsToggle(props.isConnected || false);
    }, [props.isConnected]);

    return (
        <Box
            data-key={props.fieldKey}
            sx={{ position: 'relative', ...props.style }}
            className={`${props.disabled ? 'mellon-disabled' : ''}`}
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
