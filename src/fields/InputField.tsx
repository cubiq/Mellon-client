import Box from "@mui/material/Box";
import { SxProps } from "@mui/material/styles";
import { FieldProps } from "../components/NodeContent";
import { useState } from "react";
import Stack from "@mui/material/Stack";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";

export default function InputField(props: FieldProps) {
    const [isFocused, setIsFocused] = useState(false);
    const textAlign: SxProps = props.dataType.startsWith('int') || props.dataType === 'float' || props.dataType === 'number' ? { '& input': { textAlign: 'right' } } : {};

    return (
        <Box
            sx={{
                width: '100%',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field`}
        >
            <Stack
                direction="row"
                spacing={0}
                className={`${props.disabled ? 'mellon-disabled' : ''}`}
                sx={{
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    overflow: 'hidden',
                    backgroundColor: 'background.default',
                    px: 1,
                    py: 0.5,
                    borderRadius: 0.5,
                    outlineWidth: 2,
                    outlineColor: isFocused ? 'primary.main' : 'transparent',
                    outlineStyle: 'solid',
                }}
            >
                { props.label && (
                    <Box sx={{ maxWidth: '50%', pointerEvents: 'none', pr: 1 }}>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={props.label}>{props.label}</Typography>
                    </Box>
                )}
                <InputBase
                    value={props.value ?? ''}
                    onChange={(e) => props.updateStore(props.fieldKey, e.target.value)}
                    size="small"
                    autoComplete="off"
                    className="nodrag"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    sx={{
                        ...textAlign,
                        flexGrow: 1,
                        '& .MuiInputBase-input': {
                            p: 0,
                            m: 0,
                            fontSize: 14,
                        },
                    }}
                />
            </Stack>
        </Box>
    );
}
