import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { useRef } from "react";

export default function TextareaField(props: FieldProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    return (
        <Box
            sx={{
                width: '100%',
                pt: 0.5,
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field nodrag ${textareaRef.current && textareaRef.current.scrollHeight > textareaRef.current.clientHeight ? 'nowheel' : ''}`}
        >
            <TextField
                inputRef={textareaRef}
                value={props.value}
                label={props.label}
                onChange={(e) => props.updateStore(props.fieldKey, e.target.value)}
                size="small"
                autoComplete="off"
                fullWidth
                multiline
                minRows={3}
                maxRows={12}
                slotProps={{
                    inputLabel: {
                        shrink: true,
                    }
                }}
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