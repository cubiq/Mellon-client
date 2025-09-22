import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import Slider from '@mui/material/Slider';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tooltip from "@mui/material/Tooltip";
import { useCallback } from "react";

export default function LayerConfigField(props: FieldProps) {  
    const handleSliderChange = useCallback((_event: Event, newValue: number | number[]) => {
        const value = Array.isArray(newValue) ? newValue[0] : newValue;
        const actualValue = Math.min(1.0, Math.max(0.01, value / 100));
        
        // Update the dropout property in the object
        const updatedValue = {
            ...props.value,
            dropout: Number(actualValue.toFixed(2))
        };
        props.updateStore(props.fieldKey, updatedValue);
    }, [props.value, props.fieldKey, props.updateStore]);

    const handleIndicesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const updatedValue = {
            ...props.value,
            indices: event.target.value
        };
        props.updateStore(props.fieldKey, updatedValue);
    };

    const handleCheckboxChange = (property: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const updatedValue = {
            ...props.value,
            [property]: event.target.checked
        };
        props.updateStore(props.fieldKey, updatedValue);
    };

    const getCurrentValue = () => {
        const dropoutValue = props.value?.dropout ?? (props.default || 1.0);
        const value = isNaN(Number(dropoutValue)) ? (props.default || 1.0) : Number(dropoutValue);
        const clampedValue = Math.min(1.0, Math.max(0.01, value));
        return clampedValue * 100;
    };

    const getDisplayValue = () => {
        const dropoutValue = props.value?.dropout ?? (props.default || 1.0);
        const value = isNaN(Number(dropoutValue)) ? (props.default || 1.0) : Number(dropoutValue);
        return Math.min(1.0, Math.max(0.01, value)).toFixed(2);
    };

    const dropoutVisible = props.value?.dropout_visible ?? true;
    const skipCheckboxesVisible = props.value?.skip_checkboxes_visible ?? true;

    return (
        <Box
            data-key={props.fieldKey}
            className={`mellon-field ${props.hidden ? 'mellon-hidden' : ''} ${props.disabled ? 'mellon-disabled' : ''}`}
            sx={{
                width: '100%',
                ...props.style,
            }}
        >
            <Stack
                direction="column"
                spacing={1}
                className={'nodrag'}
                sx={{
                    width: '100%',
                    px: 1.0,
                    py: 0.5,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 0.5,
                }}
            >
                {/* Label */}
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        width: '100%',
                        alignItems: 'center',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.primary',
                            flex: 1,
                        }}
                    >
                        {props.label}
                    </Typography>
                </Stack>

                {/* Slider row - conditionally rendered */}
                {dropoutVisible && (
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            width: '100%',
                            alignItems: 'center',
                        }}
                    >
                        <Slider
                            size="small"
                            value={getCurrentValue()}
                            onChange={handleSliderChange}
                            aria-label="Layer value"
                            min={1}
                            max={100}
                            sx={{flex:1}}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',                            
                            }}
                        >
                            {getDisplayValue()}
                        </Typography>                    
                    </Stack>
                )}

                {/* Indices and checkboxes row - checkboxes conditionally rendered */}
                <Stack
                    direction="row"
                    spacing={0}
                    sx={{
                        width: '100%',
                        alignItems: 'center',
                    }}
                >
                    <Tooltip title="Layer Indices" arrow>
                        <TextField
                            size="small"
                            value={props.value?.indices || ""}
                            onChange={handleIndicesChange}
                            placeholder="Indices"
                            sx={{ 
                                flex: 1,
                                '& .MuiInputBase-input': {
                                    fontSize: '0.6rem'
                                }
                            }}
                        />
                    </Tooltip>
                    {skipCheckboxesVisible && (
                        <>
                            <Tooltip title="Skip Attention" arrow>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={props.value?.skip_attention || false}
                                            onChange={handleCheckboxChange('skip_attention')}
                                        />
                                    }
                                    label="SA"
                                    sx={{ 
                                        margin: 0,
                                        '& .MuiFormControlLabel-label': {
                                            fontSize: '0.7rem'
                                        }
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title="Skip Attention Scores" arrow>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={props.value?.skip_attention_scores || false}
                                            onChange={handleCheckboxChange('skip_attention_scores')}
                                        />
                                    }
                                    label="SAS"
                                    sx={{ 
                                        margin: 0,
                                        '& .MuiFormControlLabel-label': {
                                            fontSize: '0.7rem'
                                        }
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title="Skip Feed-forward Blocks" arrow>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={props.value?.skip_ff || false}
                                            onChange={handleCheckboxChange('skip_ff')}
                                        />
                                    }
                                    label="SFF"
                                    sx={{ 
                                        margin: 0,
                                        '& .MuiFormControlLabel-label': {
                                            fontSize: '0.7rem'
                                        }
                                    }}
                                />
                            </Tooltip>
                        </>
                    )}
                </Stack>
            </Stack>
        </Box>
    )
}