import Box from "@mui/material/Box";
import MuiTextField from "@mui/material/TextField";
import { FieldProps } from "../NodeContent";

const TextField = ({
    fieldKey,
    value,
    dataType,
    style,
    disabled,
    hidden,
    label,
    updateStore,
}: FieldProps) => {
    return (
        <Box
            data-key={fieldKey}
            sx={{ ...style }}
            className={`${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
        >
            <MuiTextField
                onChange={(e) => updateStore?.(fieldKey, e.target.value)}
                variant="outlined"
                type="text"
                size="small"
                fullWidth
                label={label}
                value={value}
                className="nodrag"
                autoComplete="off"
                sx={ (dataType === 'int' || dataType === 'integer' || dataType === 'float' || dataType === 'number') ? { '& input': { textAlign: 'right' } } : {} }
            />
        </Box>
    );
}

export default TextField;