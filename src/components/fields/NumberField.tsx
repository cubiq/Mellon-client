import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { FieldProps } from "../NodeContent";
import { useTheme } from '@mui/material/styles';
import { useEffect, useRef, useState } from "react";

const NumberField = ({
    fieldKey,
    fieldType,
    dataType,
    value,
    style,
    disabled,
    hidden,
    label,
    min,
    max,
    step,
    updateStore,
}: FieldProps) => {
    const theme = useTheme();
    const inputRef = useRef<HTMLInputElement>();
    const dragStartRef = useRef({ x: 0, value: 0 });
    const isDraggingRef = useRef(false);
    const [isEditing, setIsEditing] = useState(false);

    const displaySlider = fieldType === 'slider' && min !== undefined && max !== undefined;
    const minValue = min !== undefined ? min : -Number.MAX_SAFE_INTEGER;
    const maxValue = max !== undefined ? max : Number.MAX_SAFE_INTEGER;
    const decimals = dataType === 'float' ? (step?.toString()?.split('.')?.[1]?.length || 1) : 0;
    const increment = step !== undefined ? step : (dataType === 'float' ? 0.1 : 1);

    const formatValue = (value: number | string) => {
        if ( isEditing ) {
            return value;
        }

        const newValue = isNaN(Number(value)) ? 0 : Number(value);
        return Math.min(maxValue, Math.max(minValue, newValue)).toFixed(decimals)
    };

    const inputValue = formatValue(value || 0); // we use Zustand for the value and it's already memoized

    const getSliderStyle = () => {
        if (!displaySlider) return {};

        const sliderPercent = isNaN(Number(inputValue)) ? 0 : ((Number(inputValue) - minValue) / (maxValue - minValue) * 100);
        const baseColor = 'rgba(255,255,255,0.15)';
        const gradientStyle = `linear-gradient(to right, ${baseColor} ${sliderPercent}%, rgba(255,255,255,0.0) ${sliderPercent}%)`;

        return {
            background: gradientStyle,
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const delta = e.clientX - dragStartRef.current.x;

        // ignore small movements
        if (Math.abs(delta) < 2) return;

        if (!isDraggingRef.current) {
            isDraggingRef.current = true;
        }

        const inputElement = inputRef.current;

        // we are dragging, so we remove the focus from the input
        if (document.activeElement === inputElement) {
            inputElement?.blur();
            setIsEditing(false);
        }

        const range = maxValue - minValue;
        const steps = range / increment || 100;
        const valueRange = displaySlider ? steps / 250 * delta : delta;
        const newValue = dragStartRef.current.value + valueRange*increment;

        updateStore?.(fieldKey, formatValue(newValue));
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp as any);
        
        const currentTarget = (e.target as HTMLElement).closest('.numberField');
        const closestTarget = (e.target as HTMLElement).closest('button');

        if (currentTarget && displaySlider && !isDraggingRef.current && !closestTarget) {
            const rect = currentTarget.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const relPos = Math.max(0, Math.min(1, x / rect.width));
            const newValue = formatValue(minValue + (maxValue - minValue) * relPos);
            updateStore?.(fieldKey, newValue);
        }
        
        isDraggingRef.current = false;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Only handle left mouse button
        if (e.button !== 0) return;

        // if we are already editing, don't do anything
        if (isEditing) return;

        // blur any currently focused element
        (document.activeElement as HTMLElement)?.blur();

        dragStartRef.current = { x: e.clientX, value: Number(inputValue) };

        document.addEventListener('mousemove', handleMouseMove as any);
        document.addEventListener('mouseup', handleMouseUp as any);
    };

    const handleBlur = () => {
        const inputElement = inputRef.current;
        setIsEditing(false);

        if (!inputElement) return;

        if (Number(inputElement.value) !== Number(inputValue)) {
            updateStore?.(fieldKey, formatValue(inputElement.value));
        }

        // trick to force a re-render otherwise the style won't update on blur in some edge cases
        const currentValue = inputElement.value;
        updateStore?.(fieldKey, formatValue(' ' + currentValue));
        updateStore?.(fieldKey, formatValue(currentValue));

        inputElement.removeEventListener('keydown', handleKeyDown as any);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const inputElement = inputRef.current;

        if (!inputElement) return;

        if (e.key === 'Enter' || e.key === 'Escape') {
            inputElement.removeEventListener('keydown', handleKeyDown as any);

            setIsEditing(false);
            updateStore?.(fieldKey, formatValue(inputElement.value || ''));
            inputElement.blur();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newValue = Math.min(maxValue, Math.max(minValue, Number(inputElement.value) + increment)).toFixed(decimals);
            inputElement.value = String(newValue);
            updateStore?.(fieldKey, newValue);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newValue = Math.min(maxValue, Math.max(minValue, Number(inputElement.value) - increment)).toFixed(decimals);
            inputElement.value = String(newValue);
            updateStore?.(fieldKey, newValue);
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        // ignore double clicks on buttons
        if ((e.target as HTMLElement).closest('button')) return;

        const inputElement = inputRef.current;
        if (!inputElement) return;

        inputElement.focus();
        inputElement.select();
        setIsEditing(true);

        inputElement.addEventListener('keydown', handleKeyDown as any);
    };

    useEffect(() => {
        const inputElement = inputRef.current;
        if (inputElement === document.activeElement) {
            inputElement.focus();
            setIsEditing(true);
        } else {
            inputElement?.blur();
            setIsEditing(false);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove as any);
            document.removeEventListener('mouseup', handleMouseUp as any);

            const inputElement = inputRef.current;
            if (inputElement) {
                inputElement.removeEventListener('keydown', handleKeyDown as any);
            }
        };
    }, [isEditing, inputRef]);

    return (
        <Box className={`${hidden ? 'mellon-hidden' : ''} ${disabled ? 'mellon-disabled' : ''}`}>
            <Stack
                data-key={fieldKey}
                direction="row"
                spacing={0.5}
                className={`numberField nodrag`}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
                sx={{
                    mb: 0,
                    p: 0.6,
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: 1,
                    overflow: 'hidden',
                    userSelect: 'none',
                    cursor: 'default',
                    outline: isEditing ? `2px solid ${theme.palette.primary.main}` : "1px solid #4f4f4f",
                    '&:hover': {
                        outline: isEditing ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.common.white}`,
                    },
                    ...getSliderStyle(),
                    ...style
                }}
            >
                <IconButton
                    size="small"
                    disableRipple // ripple effect is buggy
                    onClick={() => { inputRef.current?.blur(); updateStore?.(fieldKey, formatValue(Number(inputRef.current?.value) - increment)) }}
                    sx={{
                        p: 0.5,
                        borderRadius: 1,
                        opacity: Number(inputValue) <= minValue ? 0.4 : 1,
                        '&:hover': { background: Number(inputValue) <= minValue ? '' : 'rgba(255,255,255,0.15)' }
                    }}
                >
                    <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Box sx={{ maxWidth: '50%', pointerEvents: 'none' }}>
                    <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={label}>{label}</Typography>
                </Box>
                <InputBase
                    inputRef={inputRef}
                    value={inputValue}
                    size="small"
                    onChange={(e) => updateStore?.(fieldKey, formatValue(e.target.value))}
                    onBlur={handleBlur}
                    sx={{ flexGrow: 1, pointerEvents: 'none' }}
                    slotProps={{
                        input: {
                            sx: { textAlign: 'right', p: 0, cursor: 'default' },
                        },
                    }}
                />
                <IconButton
                    size="small"
                    disableRipple
                    onClick={() => { inputRef.current?.blur(); updateStore?.(fieldKey, formatValue(Number(inputRef.current?.value) + increment)) }}
                    sx={{
                        p: 0.5,
                        borderRadius: 1,
                        opacity: Number(inputValue) >= maxValue ? 0.4 : 1,
                        '&:hover': { background: Number(inputValue) >= maxValue ? '' : 'rgba(255,255,255,0.15)' }
                    }}
                >
                    <ChevronRightIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Box>
    );
}

export default NumberField;
