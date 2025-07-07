import { Handle, Position } from "@xyflow/react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { FieldProps } from "../components/NodeContent";

export default function HandleField(props: FieldProps) {
    const type = props.fieldType === 'output' ? 'source' : 'target';
    const position = props.fieldType === 'output' ? Position.Right : Position.Left;
    const textAlign = props.fieldType === 'output' ? 'right' : 'left';

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
