import { FieldProps } from "../NodeContent";
import Box from "@mui/material/Box";

const UIStringField = ({ fieldKey, value, style, disabled, hidden, label }: FieldProps) => {
    return (
        <Box
            data-key={fieldKey}
            sx={{ minWidth: '16px', minHeight: '16px', textAlign: 'center', ...style }}
            className={`${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
        >
            {value}
        </Box>
    );
};

export default UIStringField;