import { useEffect, useMemo } from "react";

import { FieldProps } from "../components/NodeContent";

import Box from "@mui/material/Box";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import fieldAction from "../utils/fieldAction";
import CircularProgress from '@mui/material/CircularProgress';

export default function SelectField(props: FieldProps) {
    const selectOptions = useMemo(() => {
        if (Array.isArray(props.options)) {
            return props.options.map((option: string) => (
                <option key={option} value={option}>{option}</option>
            ));
        }

        return Object.entries(props.options).map(([key, value]) => (
            <option key={key} value={key}>
                {typeof value === 'object' ? value.label || value.name || value.title : value}
            </option>
        ));
    }, [props.options]);

    const handleOnChange = (e: SelectChangeEvent<string>) => {
        props.updateStore(props.fieldKey, e.target.value);
        fieldAction(props, e.target.value);
    }

    useEffect(() => {
        fieldAction(props, props.value);
    }, []);

    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} ${props.disabled ? 'mellon-disabled' : ''} mellon-field`}
        >
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 0,
                width: '100%',
                backgroundColor: 'background.default',
            }}>
                <Box sx={{
                    fontSize: 13,
                    color: 'text.secondary',
                    pl: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '50%',
                }}>
                    <label htmlFor={props.nodeId + '-' + props.fieldKey}>{props.label}</label>
                </Box>
                <Select
                    value={props.value}
                    label={props.label}
                    onChange={handleOnChange}
                    size="small"
                    autoComplete="off"
                    variant="standard"
                    native
                    className="nodrag"
                    inputProps={{
                        id: props.nodeId + '-' + props.fieldKey,
                    }}
                    sx={{
                        flexGrow: 1,
                        borderRadius: 0.5,
                        backgroundColor: 'background.default',
                        '& .MuiNativeSelect-select': {
                            borderRadius: 0.5,
                            py: 0.5, px: 1,
                            m: 0,
                            transitionProperty: 'none!important',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'transparent',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'transparent',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                        },
                        '&::before': {
                            border: 'none',
                        },
                        '&::after': {
                            transition: 'none!important',
                            border: 'none',
                        },
                        '&:hover.MuiInputBase-root::before': {
                            border: 'none',
                        },
                        '&.Mui-focused::before': {
                            border: 'none',
                        },
                    }}
                >
                    {selectOptions}
                </Select>
            </Box>
            {props.disabled && props.fieldOptions?.loading && <CircularProgress size={16} sx={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'background.default' }} />}
        </Box>
    )
}