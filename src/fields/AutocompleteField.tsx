import { useState } from "react";
import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import InputBase from "@mui/material/InputBase";
import { useStore } from '@xyflow/react';

export default function AutocompleteField(props: FieldProps) {
    const zoomLevel = useStore((store) => store.transform[2]);

    const [isFocused, setIsFocused] = useState(false);
    const options = props.options as string[] | {}[] || [];

    const freeSolo = props.fieldOptions?.noValidation ?? false;
    const optionKey = props.fieldOptions?.optionKey;
    const optionLabel = props.fieldOptions?.optionLabel;

    const handleOnChange = (_: React.SyntheticEvent, value: any) => {
        if (typeof value === 'object' && value !== null) {
            if (optionKey && optionKey in value) value = value[optionKey];
            if ('key' in value) value = value.key;
            if ('id' in value) value = value.id;
            return value.value || '';
        }

        props.updateStore(props.fieldKey, value);
    }

    return (
        <Box
            sx={{
                width: '100%',
                minWidth: '300px',
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
                    //overflow: 'hidden',
                    backgroundColor: 'background.default',
                    px: 1,
                    py: 0.5,
                    borderRadius: 0.5,
                    outlineWidth: 2,
                    outlineColor: isFocused ? 'primary.main' : 'transparent',
                    outlineStyle: 'solid',
                }}
            >
                <Box sx={{ maxWidth: '50%', pr: 1 }}>
                    <Typography component="label" htmlFor={props.nodeId + '-' + props.fieldKey} sx={{ fontSize: 13, color: 'text.secondary', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={props.label}>{props.label}</Typography>
                </Box>
                <Autocomplete
                    disablePortal={false}
                    //clearOnBlur
                    selectOnFocus
                    handleHomeEndKeys={!freeSolo}
                    freeSolo={freeSolo}
                    options={options}
                    //slotProps={{ popper: CustomPopper }}
                    getOptionLabel={(option) => {
                        if (typeof option === 'string') {
                            return option;
                        }
                        return optionLabel ? option[optionLabel] ?? '' : '';
                    }}
                    // getOptionKey={(option) => {
                    //     if (typeof option === 'string') {
                    //         return option;
                    //     }
                    //     if (optionKey && optionKey in option) 
                    //         return option[optionKey];
                    //     if ('key' in option)
                    //         return option.key;
                    //     if ('id' in option)
                    //         return option.id;
                        
                    //     return option.value || '';
                    // }}
                    title={optionLabel && props.value ? props.value[optionLabel] : props.value}
                    id={props.nodeId + '-' + props.fieldKey}
                    renderInput={(params: any) => {
                        return (
                            <InputBase type="text" ref={params.InputProps.ref} inputProps={params.inputProps}
                                slotProps={{
                                    input: {
                                        sx: {
                                            width: '100%',
                                            fontSize: '14px',
                                            p: 0,
                                            m: 0,
                                        },
                                    },
                                }}
                                sx={{
                                    width: '100%',
                                    position: 'relative',
                                }}
                            />
                        );
                    }}
                    onChange={!freeSolo ? (_, value) => handleOnChange(_, value) : undefined}
                    onInputChange={freeSolo ? (_, value) => handleOnChange(_, value) : undefined}
                    value={props.value ?? ''}
                    size="small"
                    className="nodrag"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    slotProps={{
                        paper: {
                            sx: {
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'top',
                                fontSize: '12px',
                                borderRadius: 0.5,
                                backgroundColor: 'secondary.dark',
                                lineHeight: 1.25,
                                '& .MuiAutocomplete-option': {
                                    px: 1,
                                    py: 0.75,
                                },
                            },
                        },
                    }}
                    sx={{
                        width: '100%',
                    }}
                />
            </Stack>
        </Box>
    );
}
