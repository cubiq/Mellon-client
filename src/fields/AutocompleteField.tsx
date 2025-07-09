import { useState } from "react";
import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import IconButton from "@mui/material/IconButton";
import FolderIcon from "@mui/icons-material/Folder";
import InputBase from "@mui/material/InputBase";

export default function AutocompleteField(props: FieldProps) {
    const [isFocused, setIsFocused] = useState(false);

    //const optionKey = props.fieldOptions?.optionKey;
    const optionLabel = props.fieldOptions?.optionLabel;

    // const selectedValue = useMemo(() => {
    //     return (optionKey ? props.options.find((option: any) => option[optionKey] === props.value) : props.value) ?? ''
    // }, [props.options, props.value, optionKey]);

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
                <Box sx={{ maxWidth: '50%', pr: 1 }}>
                    <Typography component="label" htmlFor={props.nodeId + '-' + props.fieldKey} sx={{ fontSize: 13, color: 'text.secondary', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={props.label}>{props.label}</Typography>
                </Box>
                <Autocomplete
                    disablePortal={false}
                    freeSolo={props.fieldOptions?.noValidation ?? false}
                    options={props.options as string[] ?? []}
                    //filterOptions={(options) => options}
                    getOptionLabel={optionLabel ? (option) => option[optionLabel] ?? '' : undefined}
                    //getOptionKey={optionKey ? (option) => option[optionKey] ?? '' : undefined}
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
                    onChange={(_, value) => props.updateStore(props.fieldKey, value)}
                    value={props.value ?? ''}
                    size="small"
                    className="nodrag"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    sx={{
                        width: '100%',
                        //display: 'inline-block',
                        flexGrow: 1,
                        // '& input': {
                        //     p: 0,
                        //     m: 0,
                        //     fontSize: 14,
                        //     backgroundColor: 'background.default',
                        //     color: 'text.primary',
                        //     width: '100%',
                        //     border: 'none',
                        //     outline: 'none',
                        //     fontFamily: 'inherit',
                        // },
                        '&+.MuiAutocomplete-popper .MuiAutocomplete-option': {
                            fontSize: '12px',
                        },
                    }}
                />
                {false &&props.fieldOptions?.model_loader && (
                    <IconButton size="small" sx={{ p: 0, color: 'text.secondary' }}>
                        <FolderIcon />
                    </IconButton>
                )}
            </Stack>
        </Box>
    );
}