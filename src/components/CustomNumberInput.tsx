import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useState, useRef, EventHandler, useCallback, useEffect } from 'react';

// TODO: Someone with React expertise should review this code

const CustomNumberInput = ({
    value,
    label = '',
    dataType = 'int',
    slider = false,
    disabled = false,
    onChange,
    min,
    max,
    step,
    style,
    ...props
}: {
    dataKey: string;
    value: string | number;
    label: string;
    dataType?: string;
    slider?: boolean;
    disabled?: boolean;
    onChange: EventHandler<any>;
    min?: number;
    max?: number;
    step?: number;
    style?: { [key: string]: string };
}) => {
    const theme = useTheme();

    const sx = style || {};

    // we display the slider only if we have both min and max values
    const displaySlider = slider && min !== undefined && max !== undefined;

    // min/max normalization
    min = min !== undefined ? min : -Number.MAX_SAFE_INTEGER;
    max = max !== undefined ? max : Number.MAX_SAFE_INTEGER;
    if (min > max) {
        [min, max] = [max, min];
    }

    const minValue = min;
    const maxValue = max;
    const increment = step !== undefined ? step : (dataType === 'float' ? 0.1 : 1);
    const decimals = dataType === 'float' ? (increment.toString().split('.')[1]?.length || 1) : 0;

    const [inputValue, setInputValue] = useState(String(value || 0));
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLDivElement>(null);
    const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dragStartRef = useRef({ x: 0, value: 0 });
    const isDraggingRef = useRef(false);

    const getBackgroundStyle = (value: number) => {
        if (!displaySlider) return {};

        const sliderPercent = isNaN(Number(value)) ? 0 : ((Number(value) - minValue) / (maxValue - minValue) * 100);
        const baseColor = isDraggingRef.current ? theme.palette.secondary.main : 'rgba(255,255,255,0.25)';
        const hoverColor = theme.palette.secondary.main;

        const gradientStyle = `linear-gradient(to right, ${baseColor} ${sliderPercent}%, rgba(255,255,255,0.1) ${sliderPercent}%)`;

        return {
            background: gradientStyle,
            '&:hover': { background: `linear-gradient(to right, ${hoverColor} ${sliderPercent}%, rgba(255,255,255,0.1) ${sliderPercent}%)` }
        };
    };

    const updateValue = useCallback((value: string | number) => {
        value = Number(value);

        // if the value is invalid, it defaults to the middle of the range
        if (isNaN(value)) {
            value = (maxValue - minValue) / 2;
        }

        const newValue = String(Math.min(maxValue, Math.max(minValue, value)).toFixed(decimals));
        setInputValue(newValue);

        if (!isEditing) {
            onChange(newValue);
        }
    }, [minValue, maxValue, decimals]);

    const handleBlur = useCallback(() => {
        const inputElement = inputRef.current?.querySelector('input');
        setIsEditing(false);

        if (!inputElement) return;

        inputElement.removeEventListener('blur', handleBlur as any);
        inputElement.removeEventListener('keydown', handleKeyDown as any);
        updateValue(inputElement.value);
    }, [updateValue]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const inputElement = inputRef.current?.querySelector('input');

        if (e.key === 'Enter' || e.key === 'Escape') {
            inputElement?.removeEventListener('blur', handleBlur as any);
            inputElement?.removeEventListener('keydown', handleKeyDown as any);

            setIsEditing(false);
            updateValue(inputElement?.value || '');
            inputElement?.blur();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            updateValue(Number(inputElement?.value) + increment);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            updateValue(Number(inputElement?.value) - increment);
        }
    }, [increment, updateValue]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        clearTimeout(dragTimeoutRef.current as any);

        e.preventDefault();
        e.stopPropagation();

        if (!isDraggingRef.current) {
            isDraggingRef.current = true;
        }

        const inputElement = inputRef.current?.querySelector('input');

        // we are dragging, so we remove the focus from the input
        if (document.activeElement === inputElement) {
            inputElement?.blur();
            setIsEditing(false);
        }

        const delta = e.clientX - dragStartRef.current.x;
        const range = maxValue - minValue;
        const steps = range / increment || 100;
        const valueRange = displaySlider ? steps / 300 * delta : delta;
        const newValue = dragStartRef.current.value + valueRange*increment;

        updateValue(newValue);
        //onChange(normalizedValue);
    }, [minValue, maxValue, increment, updateValue]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        clearTimeout(dragTimeoutRef.current as any);
        const inputElement = inputRef.current?.querySelector('input');

        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp as any);
        //inputElement?.removeEventListener('blur', handleBlur as any);
        //inputElement?.removeEventListener('keydown', handleKeyDown as any);

        if (document.activeElement !== inputElement && !isDraggingRef.current && (e.target as HTMLElement).closest('button') === null) {
            // give the focus to the input, unless we are clicking on a left/right button
            inputElement?.focus();
            inputElement?.addEventListener('blur', handleBlur as any);
            inputElement?.addEventListener('keydown', handleKeyDown as any);
            setIsEditing(true);
        } else {
            inputElement?.blur();
            setIsEditing(false);
        }

        isDraggingRef.current = false;
    }, [handleBlur, handleKeyDown]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only handle left mouse button
        if (e.button !== 0) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        const inputElement = inputRef.current?.querySelector('input');

        // If the input is already focused, act like a standard text field
        // this allows to edit the value by just typing
        if (document.activeElement === inputElement) return;

        (document.activeElement as HTMLElement)?.blur();

        e.preventDefault();
        e.stopPropagation();

        dragStartRef.current = { x: e.clientX, value: Number(inputValue) };

        // we wait 200ms before entering dragging mode
        // a quick click will just focus the input without starting the drag
        dragTimeoutRef.current = setTimeout(() => {
            inputElement?.blur();
            isDraggingRef.current = true;
        }, 200);

        document.addEventListener('mousemove', handleMouseMove as any);
        document.addEventListener('mouseup', handleMouseUp as any);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        //const value = e.target.value;
        setInputValue(e.target.value);
        //onChange(value);
    };

    useEffect(() => {
        setInputValue(String(value));
    }, [value]);

    useEffect(() => {
        return () => {
            clearTimeout(dragTimeoutRef.current as any);
            document.removeEventListener('mousemove', handleMouseMove as any);
            document.removeEventListener('mouseup', handleMouseUp as any);

            const inputElement = inputRef.current?.querySelector('input');
            if (inputElement) {
                inputElement.removeEventListener('blur', handleBlur as any);
                inputElement.removeEventListener('keydown', handleKeyDown as any);
            }
        };
    }, [handleMouseMove, handleMouseUp, handleBlur, handleKeyDown]);

    const field = (
        <Stack
            data-key={props.dataKey}
            direction="row"
            spacing={0.5}
            className={`nodrag customNumberInput${disabled ? ' mellon-disabled' : ''}`}
            onMouseDown={handleMouseDown}
            sx={{
                mb: 0,
                p: 0.5,
                width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
                ...getBackgroundStyle(Number(inputValue)),
                borderRadius: 1,
                overflow: 'hidden',
                userSelect: 'none',
                cursor: 'default',
                outline: isEditing ? `2px solid ${theme.palette.primary.main}` : 'none',
                ...sx,
            }}
        >
            <IconButton
                size="small"
                disableRipple // ripple effect is buggy
                onClick={() => updateValue(Number(inputValue) - increment)}
                sx={{
                    borderRadius: 1,
                    opacity: Number(inputValue) <= minValue ? 0.4 : 1,
                    '&:hover': { background: Number(inputValue) <= minValue ? '' : 'rgba(255,255,255,0.15)' }
                }}
            >
                <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Box sx={{ maxWidth: '50%'}}>
                <Typography sx={{ fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={label}>{label}</Typography>
            </Box>
            <InputBase
                ref={inputRef}
                value={inputValue}
                onChange={handleChange}
                size="small"
                sx={{ flexGrow: 1 }}
                slotProps={{
                    input: {
                        sx: { textAlign: 'right', padding: 0, cursor: 'default' },
                    },
                }}
            />
            <IconButton
                size="small"
                disableRipple
                onClick={() => updateValue(Number(inputValue) + increment)}
                sx={{
                    borderRadius: 1,
                    opacity: Number(inputValue) >= maxValue ? 0.4 : 1,
                    '&:hover': { background: Number(inputValue) >= maxValue ? '' : 'rgba(255,255,255,0.15)' }
                }}
            >
                <ChevronRightIcon fontSize="small" />
            </IconButton>
        </Stack>
    );

    return field;
};

export default CustomNumberInput;