import { FieldProps } from "../NodeContent";
import Box from "@mui/material/Box";

const UIImageField = ({ fieldKey, value, style, disabled, hidden, label }: FieldProps) => {
    return (
        <Box
            data-key={fieldKey}
            sx={{ minWidth: '16px', minHeight: '16px', textAlign: 'center', ...style }}
            className={`${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
        >
            <img src={value || `https://placehold.co/512/1F1F1F/1F1F1F?text=`} alt={label} />
        </Box>
    );
};

export default UIImageField;