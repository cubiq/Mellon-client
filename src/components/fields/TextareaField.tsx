import Box from "@mui/material/Box";
import { FieldProps } from "../NodeContent";
import { TextField } from "@mui/material";

const TextareaField = ({ fieldKey, value, style, disabled, hidden, label, updateStore }: FieldProps) => {
    return (
        <Box
            key={fieldKey}
            data-key={fieldKey}
            className={`nodrag nowheel ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
            sx={{ minWidth: '320px', ...style }}
        >
            <TextField
                variant="outlined"
                type="text"
                size="small"
                fullWidth
                multiline
                minRows={3}
                maxRows={12}
                label={label}
                value={value}
                onChange={(e) => updateStore?.(fieldKey, e.target.value)}
            />
        </Box>
    );
}

export default TextareaField;