import Box from "@mui/material/Box";
import { FieldProps } from "../components/NodeContent";
import Stack from "@mui/material/Stack";

import InputField from "./InputField";
import IconButton from "@mui/material/IconButton";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export default function RandomField(props: FieldProps) {
    const fieldValue = typeof props.value === 'object' && 'value' in props.value
        ? props.value.value || 0
        : props.value || 0;
    const isRandom = typeof props.value === 'object' && 'isRandom' in props.value
        ? props.value.isRandom
        : false;
    
    const randomToggle = () => {
        props.updateStore(props.fieldKey, { value: fieldValue, isRandom: !isRandom });
    }

    const handleFieldChange = (key: string, value: any) => {
        props.updateStore(key, { value, isRandom });
    }

    return (
        <Box
            sx={{
                width: '100%',
                ...props.style,
            }}
            data-key={`${props.fieldKey}-random`}
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field`}
        >
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    width: '100%',
                    alignItems: 'center',
                }}
            >
                <InputField
                    {...props}
                    value={fieldValue}
                    disabled={isRandom}
                    updateStore={handleFieldChange}
                />
                <IconButton
                    size="small"
                    className='nodrag'
                    sx={{
                        color: isRandom ? 'primary.main' : 'text.secondary',
                        opacity: isRandom ? 1 : 0.5,
                        width: 24,
                        height: 24,
                    }}
                    onClick={randomToggle}
                >
                    <AutoFixHighIcon />
                </IconButton>
            </Stack>
        </Box>
    );
}