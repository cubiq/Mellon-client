import { useEffect, useState } from "react";
import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import IconButton from "@mui/material/IconButton";
import FolderIcon from "@mui/icons-material/Folder";
import InputBase from "@mui/material/InputBase";
import { useNodesStore } from "../stores/useNodeStore";

export default function AutocompleteField(props: FieldProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const { hfCache } = useNodesStore.getState();

    //const optionKey = props.fieldOptions?.optionKey;
    const optionLabel = props.fieldOptions?.optionLabel;
    // TODO: might be worth to use a memoized function to get the options
    const getOptions = () => {
        let options = props.options as string[] ?? [];
        if (props.optionsSource?.source === 'hf_cache') {
            const className = Array.isArray(props.optionsSource?.filter?.className) ? props.optionsSource?.filter?.className : [props.optionsSource?.filter?.className];
            if (className.length > 0) {
                const hfOptions = hfCache
                    .filter((item) => Array.isArray(item.class_names) && item.class_names.some((name: string) => className.includes(name)))
                    .map((item) => item.id);
                options = Array.from(new Set([...options, ...hfOptions]));
            }
        }

        return options;
    }

    //const options = useMemo(() => getOptions(), [props.optionsSource]);
    useEffect(() => {
        setOptions(getOptions());
    }, [hfCache]);

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
                    //clearOnBlur
                    //selectOnFocus
                    handleHomeEndKeys
                    freeSolo={props.fieldOptions?.noValidation ?? false}
                    options={options}
                    //filterOptions={(options) => options}
                    getOptionLabel={(option) => {
                        if (typeof option === 'string') {
                            return option;
                        }
                        return optionLabel ? option[optionLabel] ?? '' : '';
                    }}
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