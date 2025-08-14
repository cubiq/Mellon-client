import { useEffect } from "react";

import { FieldProps } from "../components/NodeContent";

import Box from "@mui/material/Box";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import fieldAction from "../utils/fieldAction";
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import ListSubheader from "@mui/material/ListSubheader";
import Chip from "@mui/material/Chip";

export default function SelectField(props: FieldProps) {
    const currValue = props.fieldOptions?.multiple
        ? !Array.isArray(props.value) ? props.value !== undefined && props.value !== null ? [props.value] : [] : props.value
        : props.value;

    const validOptions = Array.isArray(props.options)
        ? props.options.map(String)
        : Object.keys(props.options);

    const fieldValue = props.fieldOptions?.multiple
        ? Array.isArray(currValue)
            ? currValue.filter((v) => validOptions.includes(String(v)))
            : []
        : validOptions.includes(String(currValue)) ? currValue : "";

    const selectOptions = (() => {
        if (Array.isArray(props.options)) {
            if (props.fieldOptions?.multiple) {
                return [
                    props.fieldOptions?.placeholder ?
                    <MenuItem key="placeholder" disabled value="">
                        <em>{props.fieldOptions?.placeholder}</em>
                    </MenuItem> : null,
                    ...props.options.map((option: string) => (
                    <MenuItem key={option} value={option} sx={{ p: 0, pr: 1.5 }}>
                        <Checkbox checked={fieldValue.includes(option)} />
                        <ListItemText primary={option} />
                    </MenuItem>
                ))];
            }

            return props.options.map((option: string) => (
                <option key={option} value={option}>{option}</option>
            ));
        }

        if (props.fieldOptions?.multiple) {
            return [
                props.fieldOptions?.placeholder ?
                <MenuItem key="placeholder" disabled value="">
                    <em>{props.fieldOptions?.placeholder}</em>
                </MenuItem> : null,
                ...Object.entries(props.options).map(([k, v]) => (
                k.startsWith('__') ? 
                <ListSubheader key={k} sx={{ px: 2, py: 1.5, lineHeight: 1 }}>
                    {typeof v === 'object' ? v.label || v.name || v.title : v}
                </ListSubheader> :
                <MenuItem key={k} value={k} sx={{ p: 0 }}>
                    <Checkbox checked={fieldValue.includes(k)} size="small" />
                    <ListItemText primary={typeof v === 'object' ? v.label || v.name || v.title : v} />
                </MenuItem>
            ))];
        }

        return Object.entries(props.options).map(([key, value]) => (
            <option key={key} value={key}>
                {typeof value === 'object' ? value.label || value.name || value.title : value}
            </option>
        ));
    })();

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
                    minWidth: 56,
                }}>
                    <label htmlFor={props.nodeId + '-' + props.fieldKey}>{props.label}</label>
                </Box>
                <Select
                    multiple={!!props.fieldOptions?.multiple}
                    value={fieldValue}
                    label={props.label}
                    displayEmpty={!!props.fieldOptions?.placeholder}
                    onChange={handleOnChange}
                    size="small"
                    autoWidth
                    autoComplete="off"
                    variant="standard"
                    native={!props.fieldOptions?.multiple}
                    className="nodrag"
                    renderValue={props.fieldOptions?.multiple && ((selected: string[]) => {
                        if (props.fieldOptions?.placeholder && selected.length === 0) {
                            return props.fieldOptions.placeholder;
                        }

                        return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((v: string) => {
                                let label: string = '';
                                if (!Array.isArray(props.options) && typeof props.options === 'object') {
                                    const opt = props.options[v];
                                    label = typeof opt === 'object' ? opt?.label || opt?.name || opt?.title || '' : String(opt);
                                } else if (Array.isArray(props.options)) {
                                    label = String(v);
                                }
                                return (
                                    <Chip key={v} label={label} size="small" sx={{ backgroundColor: 'secondary.main', borderRadius: 0.5 }} />
                                );
                            })}
                            </Box>
                        );
                    })}
                    inputProps={{
                        id: props.nodeId + '-' + props.fieldKey,
                    }}
                    MenuProps={{
                        transitionDuration: 0,
                        PaperProps: {
                            sx: {
                                bgcolor: 'secondary.dark',
                            }
                        }
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
                        '& .MuiSelect-select': {
                            fontSize: 14,
                            minWidth: 300,
                            py: 0.5, px: 1,
                            m: 0,
                            '&>.MuiBox-root': {
                                maxWidth: '560px',
                            },
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