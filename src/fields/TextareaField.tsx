import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

export default function TextareaField(props: FieldProps) {
    return (
        <Box
            sx={{
                width: '100%',
                pt: 0.5,
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field`}
>
            <TextField
                value={props.value}
                onChange={(e) => props.updateStore(props.fieldKey, e.target.value)}
                size="small"
                autoComplete="off"
                fullWidth
                multiline
                slotProps={{
                    inputLabel: {
                        shrink: true,
                    }
                }}
                minRows={3}
                maxRows={12}
                label={props.label}
                sx={{
                    backgroundColor: 'background.default',
                    '& .MuiInputBase-root': {
                        p: 1,
                        borderRadius: 0.5,
                    },
                    '& .MuiInputLabel-root': {
                        backgroundColor: 'background.paper',
                        px: 1,
                        ml: -0.5
                    },
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'transparent',
                        },
                        '&:hover fieldset': {
                            borderColor: 'transparent',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                        },
                    },
                }}
            />
        </Box>
    )
}