import { useRef, useState, useEffect } from "react";

import { FieldProps } from "../components/NodeContent";
import getDecimalPlaces from "../utils/getDecimalPlaces";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';


export default function NumberField(props: FieldProps) {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragStartRef = useRef<{ x: number, value: number, moved: boolean } | null>(null);

    const isSlider = props.fieldType === 'slider' && props.min !== undefined && props.max !== undefined;
    const minValue = props.min !== undefined ? props.min : -Number.MAX_SAFE_INTEGER;
    const maxValue = props.max !== undefined ? props.max : Number.MAX_SAFE_INTEGER;
    const decimals = props.dataType === 'float' ? getDecimalPlaces(props.step) : 0;
    const increment = props.step !== undefined ? props.step : (props.dataType === 'float' ? 0.1 : 1);

    const formatValue = (value: number | string, force: boolean = false) => {
        if (isFocused && !force) {
            return value;
        }
        const newValue = isNaN(Number(value)) ? props.default : Number(value);
        return Math.min(maxValue, Math.max(minValue, newValue)).toFixed(decimals)
    }
    const handleChevronClick = (direction: 'left' | 'right') => {
        if (!inputRef.current) return;

        inputRef.current.blur();
        props.updateStore(props.fieldKey, formatValue(direction === 'left' ? Number(inputRef.current.value) - increment : Number(inputRef.current.value) + increment));
    }
    const sliderStyle = () => {
        if (!isSlider) return {};

        const percent = isNaN(Number(props.value)) ? 0 : (Number(props.value) - minValue) / (maxValue - minValue) * 100;
        const gradient = `linear-gradient(to right, rgba(255,255,255,0.15) ${percent}%, rgba(255,255,255,0.0) ${percent}%)`;
        return {
            background: gradient,
        }
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        // only handle left mouse button
        if (e.button !== 0) return;

        if (isFocused) return;
        // blur any currently focused element
        (document.activeElement as HTMLElement)?.blur();

        dragStartRef.current = { x: e.clientX, value: Number(props.value), moved: false };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dragStartRef.current) return;

        if (document.activeElement === inputRef.current) {
            setIsFocused(false);
            inputRef.current?.blur();
        }

        const deltaX = e.clientX - dragStartRef.current.x;
        // ignore small movements

        if (Math.abs(deltaX) < 3) return;
        dragStartRef.current.moved = true;

        const range = maxValue - minValue;
        const step = range / increment || 100; // increment * (range / 100);
        const valueRange = isSlider ? step / 250 * deltaX : deltaX;
        const newValue = dragStartRef.current.value + valueRange*increment;

        props.updateStore(props.fieldKey, formatValue(newValue));
    }   
    const handleMouseUp = (e: MouseEvent) => {
        if (!dragStartRef.current) return;

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (!isSlider) return;

        // check if the mouseup event was triggered by the current field
        const targetField = (e.target as HTMLElement).closest('.mellon-field');
        const targetButton = (e.target as HTMLElement).closest('button');
        if (targetField && !targetButton && !dragStartRef.current.moved) {
            const rect = targetField.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const relPos = Math.max(0, Math.min(1, x /rect.width));
            const newValue = minValue + (maxValue - minValue) * relPos;
            props.updateStore(props.fieldKey, formatValue(newValue));
        }

        dragStartRef.current = null;
    }

    const handleBlur = () => {
        setIsFocused(false);

        if (!inputRef.current) return;

        const newValue = formatValue(inputRef.current.value, true);
        props.updateStore(props.fieldKey, newValue);
        inputRef.current.value = String(newValue);

        inputRef.current.removeEventListener('keydown', handleKeyDown);
    }

    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;

        if (!inputRef.current) return;

        inputRef.current.select();
        inputRef.current.focus();

        inputRef.current.addEventListener('keydown', handleKeyDown);
    }
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!inputRef.current) return;

        if (e.key === 'Enter' || e.key === 'Escape') {
            inputRef.current.blur();
            setIsFocused(false);
            inputRef.current.removeEventListener('keydown', handleKeyDown);
            props.updateStore(props.fieldKey, formatValue(inputRef.current.value));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newValue = formatValue(Number(inputRef.current.value) + increment, true) //Math.min(maxValue, Math.max(minValue, Number(inputRef.current.value) + increment)).toFixed(decimals);
            inputRef.current.value = String(newValue);
            props.updateStore(props.fieldKey, newValue);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newValue = formatValue(Number(inputRef.current.value) - increment, true) //Math.min(maxValue, Math.max(minValue, Number(inputRef.current.value) - increment)).toFixed(decimals);
            inputRef.current.value = String(newValue);
            props.updateStore(props.fieldKey, newValue);
        }
    }

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            if (inputRef.current) {
                inputRef.current.removeEventListener('keydown', handleKeyDown);
            }
        }
    }, [inputRef]);

    return (
        <Box
            sx={{
                width: '100%',
                backgroundColor: 'background.default',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} ${props.disabled ? 'mellon-disabled' : ''} mellon-field`}
        >
            <Stack
                direction="row"
                spacing={0.5}
                className={'nodrag'}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
                sx={{
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    overflow: 'hidden',
                    backgroundColor: 'background.default',
                    px: 0.5,
                    py: 0.5,
                    borderRadius: 0.5,
                    outlineWidth: 2,
                    outlineColor: isFocused ? 'primary.main' : 'transparent',
                    outlineStyle: 'solid',
                    cursor: 'default',
                    ...sliderStyle(),
                }}
            >
                <IconButton
                    size="small"
                    disableRipple
                    disabled={Number(props.value) <= minValue}
                    onClick={() => handleChevronClick('left')}
                    sx={{
                        p: 0,
                        borderRadius: 0.5,
                        //opacity: Number(props.value) <= minValue ? 0.4 : 1
                    }}
                >
                    <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Box sx={{ maxWidth: '50%', pointerEvents: 'none', pr: 1 }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={props.label}>{props.label}</Typography>
                </Box>
                <InputBase
                    inputRef={inputRef}
                    value={formatValue(props.value)}
                    onChange={(e) => props.updateStore(props.fieldKey, formatValue(e.target.value))}
                    size="small"
                    autoComplete="off"
                    className="nodrag"
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    slotProps={{
                        input: {
                            sx: {
                                textAlign: 'right',
                                p: 0,
                                m: 0,
                                fontSize: 14,
                                cursor: 'default',
                            }
                        }
                    }}
                    sx={{
                        flexGrow: 1,
                    }}
                />
                <IconButton
                    size="small"
                    disableRipple
                    disabled={Number(props.value) >= maxValue}
                    onClick={() => handleChevronClick('right')}
                    sx={{
                        p: 0,
                        borderRadius: 0.5,
                        //opacity: Number(props.value) >= maxValue ? 0.4 : 1
                    }}
                >
                    <ChevronRightIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Box>       
    );
}