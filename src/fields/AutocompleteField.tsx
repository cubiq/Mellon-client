import { useEffect, useMemo, useState } from "react";
import { FieldProps } from "../components/NodeContent";
import { useStore } from '@xyflow/react';
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Popper from "@mui/material/Popper";
import fieldAction from "../utils/fieldAction";

function getOptionKey(option: any, key?: string) {
    if (typeof option === 'string') {
        return option;
    }
    if (option === null || option === undefined) {
        return null;
    }
    if (key && key in option) {
        return option[key];
    }
    if ('key' in option) {
        return option.key;
    }
    if ('id' in option) {
        return option.id;
    }
    return null;
};

function getOptionLabel(option: any, key?: string) {
    if (typeof option === 'string') {
        return option;
    }
    if (option === null || option === undefined) {
        return null;
    }
    if (key && key in option) {
        return option[key];
    }
    if ('label' in option) {
        return option.label;
    }
    if ('name' in option) {
        return option.name;
    }
    if ('title' in option) {
        return option.title;
    }
    return null;
};

function getOptionValue(option: any, key?: string) {
    if (typeof option === 'string') {
        return null;
    }
    if (option === null || option === undefined) {
        return null;
    }
    if (key && key in option) {
        return option[key];
    }
    if ('value' in option) {
        return option.value;
    }
    return null;
};

function toOptionObj(val: any) {
    if (!val) return '';
    if (typeof val === "string") {
        return { id: val, label: val, value: val };
    }
    if (val.id === undefined || val.id === null) return '';
    return {
        id: val.id,
        label: val.label ?? val.id,
        value: val.value ?? val.id,
    };
};

// props.options can be a string, an array, an object or an array of objects
// normalize it into an array of objects in the following format:
// [{ id: 'id', label: 'label', value: 'value' }, ...]
function normalizeOptions(options: any, idKey?: string, labelKey?: string, valueKey?: string): any[] {
    if (!options) return [];
    if (options && typeof options === 'string') {
        return [{ id: options, label: options, value: options }];
    }
    if (Array.isArray(options)) {
        return options.map((option, index) => ({
            id: getOptionKey(option, idKey) ?? index,
            label: getOptionLabel(option, labelKey) ?? getOptionKey(option, idKey) ?? index,
            value: getOptionValue(option, valueKey) ?? getOptionKey(option, idKey) ?? index,
        })).filter(option => option.id !== undefined && option.id !== null && option.id !== '');
    }
    if (typeof options === 'object') {
        return Object.entries(options).map(([key, value]) => ({
            id: key,
            label: getOptionLabel(value, labelKey) ?? key,
            value: getOptionValue(value, valueKey) ?? key,
        })).filter(option => option.id !== undefined && option.id !== null && option.id !== '');
    }
    return [];
}

const ZoomPopper = (props: any) => {
    const zoomLevel = useStore((store) => store.transform[2]);
    const { style, ...other } = props;
    const newStyle = {
        ...style,
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top',
        minWidth: 'fit-content',
    };
    return <Popper {...other} style={newStyle} />;
};

export default function AutocompleteField(props: FieldProps) {
    const [isFocused, setIsFocused] = useState(false);

    const idKey = props.fieldOptions?.optionKey;
    const labelKey = props.fieldOptions?.optionLabel;
    const valueKey = props.fieldOptions?.optionValue;

    const multiple = !!props.fieldOptions?.multiple || false;
    const freeSolo = !!props.fieldOptions?.noValidation || false;

    const fieldOptions = useMemo(() => normalizeOptions(props.options, idKey, labelKey, valueKey), [props.options]);
    const fieldValue = (() => {
        const processValue = (val: any) => {
            if (val === null || val === undefined || val === '') return freeSolo ? '' : null;

            if (typeof val === "string") {
                const opt = findOptionById(val);
                if (opt) return opt;
                return freeSolo ? toOptionObj(val) : null;
            }

            if (typeof val === "object" && val.id) {
                const opt = findOptionById(val.id);
                if (opt) return opt;
            }
            
            return freeSolo ? toOptionObj(val) : null;
        };

        if (multiple) {
            if (!props.value) return [];
            const valueAsArray = Array.isArray(props.value) ? props.value : [props.value];
            return valueAsArray.map(processValue).filter(Boolean);
        } else {
            return processValue(props.value);
        }
    })();

    function parseReturnedValue(value: any) {
        if (!value) return null;

        if (typeof value === 'string') {
            if (freeSolo && !multiple) return value;
            return freeSolo ? { id: value, value } : null;
        }
        if (Array.isArray(value)) {
            return value.map(option => 
                option.id === option.value ? option.id : { id: option.id, value: option.value }
            );
        }
        if (typeof value === 'object') {
            return value.id === value.value ? value.id : { id: value.id, value: value.value };
        }
        return null;
    }

    const handleOnChange = (_: React.SyntheticEvent, value: any) => {
        props.updateStore(props.fieldKey, parseReturnedValue(value));
    }

    const handleOnInputChange = (_: React.SyntheticEvent, value: string) => {
        if (freeSolo && !multiple) {
            props.updateStore(props.fieldKey, value);
        }
        fieldAction(props, value);
    }

    function findOptionById(id: string) {
        return fieldOptions.find(option => option.id === id);
    }

    useEffect(() => {
        fieldAction(props, props.value);
    }, []);

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
                    backgroundColor: 'background.default',
                    px: 1, py: 0.5,
                    borderRadius: 0.5,
                    outlineWidth: 2,
                    outlineColor: isFocused ? 'primary.main' : 'transparent',
                    outlineStyle: 'solid',
                }}
            >
                {props.label &&(
                <Box sx={{ maxWidth: '50%', pr: 1, flexGrow: 0 }}>
                    <Typography component="label" htmlFor={props.nodeId + '-' + props.fieldKey} sx={{ fontSize: 13, color: 'text.secondary', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={props.label}>{props.label}</Typography>
                </Box>
                )}
                <Autocomplete
                    disablePortal={false}
                    selectOnFocus
                    multiple={multiple}
                    handleHomeEndKeys={!freeSolo}
                    disableCloseOnSelect={!!props.fieldOptions?.disableCloseOnSelect}
                    freeSolo={freeSolo}
                    options={fieldOptions}
                    value={fieldValue}
                    disableClearable={!multiple}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    size="small"
                    className="nodrag"
                    getOptionLabel={(option) => option.label ?? option}
                    getOptionKey={(option) => option.id ?? option}
                    onChange={handleOnChange}
                    onInputChange={handleOnInputChange}
                    sx={{
                        width: '100%',
                        overflow: 'hidden',
                        lineHeight: 1,
                        '& .MuiInputBase-root': {
                            fontSize: 14,
                            borderRadius: 0,
                            bgcolor: 'background.default',
                        },
                        '& .MuiOutlinedInput-root.MuiInputBase-sizeSmall .MuiAutocomplete-input': {
                            p: 0,
                        },
                        '& .MuiOutlinedInput-root.MuiInputBase-sizeSmall': {
                            p: 0,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            border: '0!important',
                            p: 0,
                            '&>legend': {
                                display: 'none'
                            }
                        },
                        '& .MuiOutlinedInput-root .MuiAutocomplete-endAdornment': {
                            right: 0,
                        },
                        '& .MuiIconButton-root': {
                            fontSize: 14,
                            width: 14,
                            height: 14,
                            background: 'transparent!important',
                            ml: 1,
                        },
                        '& .MuiChip-root': {
                            borderRadius: 0.5,
                            bgcolor: 'secondary.main',
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            hiddenLabel
                            fullWidth
                            autoComplete="off"
                            size="small"
                            placeholder={props.fieldOptions?.placeholder}
                        />
                    )}
                    slots={{
                        popper: ZoomPopper,
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                //transform: `scale(${zoomLevel})`,
                                //transformOrigin: 'top',
                                fontSize: '14px',
                                borderRadius: 0.5,
                                backgroundColor: 'secondary.dark',
                                lineHeight: 1,
                                '& .MuiAutocomplete-option': {
                                    px: 1.5,
                                    py: 1,
                                },
                            },
                        },
                        // popper: {
                        //     sx: {
                        //         minWidth: 'fit-content'
                        //     },
                        // },
                    }}
                    // slots={{
                    //     popper: (props) => {
                    //         const {style, ...others} = props
                    //         return <Popper {...others} style={{ ...style, minWidth: 'fit-content' }} />
                    //     }
                    // }}
                />
            </Stack>
        </Box>
    )
}
