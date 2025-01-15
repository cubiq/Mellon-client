import { Handle, Position } from "@xyflow/react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { FieldProps } from "../NodeContent";

const InputHandle = ({ fieldKey, label, style, disabled, hidden, dataType }: FieldProps) => {
    return (
        <Box
            data-key={fieldKey}
            sx={{ position: 'relative', ...style }}
            className={`${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
        >
            <Handle
                id={fieldKey}
                type="target"
                position={Position.Left}
                className={`${dataType}-handle`}
                style={{ marginTop: '-4px' }}
            />
            <Typography sx={{ pl: 1 }}>{label}</Typography>
        </Box>
    )
}

const OutputHandle = ({ fieldKey, label, style, disabled, hidden, dataType }: FieldProps) => {
    return (
        <Box
            data-key={fieldKey}
            sx={{ position: 'relative', ...style }}
            className={`${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
        >
            <Handle
                id={fieldKey}
                type="source"
                position={Position.Right}
                className={`${dataType}-handle`}
                style={{ marginTop: '-4px' }}
            />
            <Typography sx={{ textAlign: 'right', pr: 1 }}>{label}</Typography>
        </Box>
    )
}

const HandleField = ({ fieldType, fieldKey, label, style, disabled, hidden, dataType }: FieldProps) => {
    const HandleElement = fieldType === 'input' ? InputHandle : OutputHandle;

    return (
        <HandleElement
            fieldKey={fieldKey}
            label={label}
            style={style}
            disabled={disabled}
            hidden={hidden}
            dataType={dataType}
        />
    );
}

export default HandleField;