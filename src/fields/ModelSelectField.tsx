import { useEffect, useState } from "react";

import { FieldProps } from "../components/NodeContent";

import Box from "@mui/material/Box";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import IconButton from "@mui/material/IconButton";
import AutocompleteField from "./AutocompleteField";

import RefreshIcon from '@mui/icons-material/Refresh';
import { useNodesStore } from "../stores/useNodeStore";

export default function ModelSelectField(props: FieldProps) {
    const activeSources = Array.isArray(props.fieldOptions?.sources) ? props.fieldOptions?.sources : props.fieldOptions?.sources === 'hub' || props.fieldOptions?.sources === 'local' ? [props.fieldOptions?.sources] : ['hub', 'local'];
    const propsValue = typeof props.value === 'string' && activeSources.length === 1 ? { source: activeSources[0], value: props.value } : props.value || { source: 'hub', value: '' };
    const sourceType = activeSources.length === 1 ? activeSources[0] : propsValue.source || 'hub';
    const fieldValue = propsValue.value ?? '';
    const { hfCache, localModels } = useNodesStore.getState();
    const fetchLocalModels = useNodesStore((state) => state.fetchLocalModels);
    const fetchHfCache = useNodesStore((state) => state.fetchHfCache);
    const isLoading = useNodesStore((state) => state.isLoading);

    const [hubOptions, setHubOptions] = useState<string[]>([]);
    const [localModelOptions, setLocalModelOptions] = useState<string[]>([]);

    const handleSourceTypeChange = (_: React.MouseEvent<HTMLElement>, source: 'hub' | 'local') => {
        if (!source) return;

        const propsDefault = typeof props.default === 'string' ? { source: activeSources[0], value: props.default } : props.default || { source, value: '' };
        const value = propsDefault.source === source ? propsDefault.value : '';
        props.updateStore(props.fieldKey, { ...propsValue, value, source: source });
    }

    const handleFieldChange = (key: string, value: any) => {
        props.updateStore(key, { ...propsValue, value });
    }

    const handleRefresh = async () => {
        props.updateStore(props.fieldKey, true, 'disabled');
        try {
            await fetchHfCache(true);
            await fetchLocalModels(true);
        } finally {
            const defaultValue = typeof props.default === 'string' ? { source: sourceType, value: props.default } : props.default || { source: 'hub', value: '' };
            const value = defaultValue.source === sourceType ? defaultValue.value : '';
            props.updateStore(props.fieldKey, { ...propsValue, value });
            props.updateStore(props.fieldKey, false, 'disabled');
        }
    }

    const getHubOptions = () => {
        const hubFilter = props.fieldOptions?.filter?.hub || {};

        let options = Array.isArray(props.options) ? props.options : [];
        //const className = Array.isArray(hubFilter.className) ? hubFilter.className : hubFilter.className ? [hubFilter.className] : [];
        const className = hubFilter.className || [];
        if (typeof className === 'string') {
            const cnRegex = new RegExp(className);
            const cnMatch = hfCache.filter((item) =>
                Array.isArray(item.class_names)
                    ? item.class_names.some((name: string) => cnRegex.test(name))
                    : cnRegex.test(item.class_names))
                .map((item) => item.id
            );
            options = Array.from(new Set([...options, ...cnMatch]));
        } else if (Array.isArray(className) && className.length > 0) {
            const cnOptions = hfCache.filter((item) =>
                Array.isArray(item.class_names)
                    ? item.class_names.some((name: string) => className.includes(name))
                    : className.includes(item.class_names))
                .map((item) => item.id
            );
            options = Array.from(new Set([...options, ...cnOptions]));
        } else {
            options = Array.from(new Set([...options, ...hfCache.map((item) => item.id)]));
        }

        const idMatch = hubFilter.id || '';
        if (idMatch) {
            try {
                const regex = new RegExp(idMatch);
                options = options.filter((item) => regex.test(item));
                //options = Array.from(new Set([...options, ...hubOptions.map((item) => item.id)]));
            } catch (error) {
                console.warn('Invalid regex pattern:', idMatch, error);
            }
        }
        setHubOptions(options);
    }

    const getLocalOptions = () => {
        let options = props.options as string[] ?? [];
        const localFilter = props.fieldOptions?.filter?.local || {};
        const fileMatch = localFilter.id || '';
        if (fileMatch) {
            try {
                const regex = new RegExp(fileMatch);
                const localOptions = localModels.filter((item) => regex.test(item))
                options = localOptions;
            } catch (error) {
                console.warn('Invalid regex pattern:', fileMatch, error);
            }
        } else {
            options = localModels;
        }
        setLocalModelOptions(options);
    }

    useEffect(() => {
        getHubOptions();
    }, [hfCache]);

    useEffect(() => {
        getLocalOptions();
    }, [localModels]);

    useEffect(() => {
        if (typeof props.default === 'string') {
            props.updateStore(props.fieldKey, { source: activeSources[0], value: props.default });
        }
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
            <ToggleButtonGroup
                value={sourceType}
                exclusive
                size="small"
                className="nodrag"
                onChange={handleSourceTypeChange}
                disabled={props.disabled || isLoading}
                sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'left',
                    justifyContent: 'left',
                    '& .MuiButtonBase-root': {
                        fontSize: 12,
                        px: 1.5,
                        py: 0,
                        border: 'none',
                        borderRadius: '3px 3px 0 0',
                        color: 'text.secondary',
                        zIndex: 0,
                        '&.Mui-selected': {
                            color: 'primary.main',
                            backgroundColor: 'background.default',
                            //color: 'primary.contrastText',
                        },
                        '&.Mui-disabled': {
                            border: 'none'
                        }
                    },
                }}
            >
                {activeSources.includes('hub') && ( <ToggleButton disableRipple value="hub" title="Hugging Face Hub">HF&nbsp;Hub</ToggleButton> )}
                {activeSources.includes('local') && ( <ToggleButton disableRipple value="local" title="Local Models">Local</ToggleButton> )}
            </ToggleButtonGroup>
            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 0.5,
                }}
            >
                <AutocompleteField
                    {...props}
                    style={{ zIndex: 1 }}
                    value={fieldValue}
                    disabled={props.disabled || isLoading}
                    options={sourceType === 'hub' ? hubOptions : localModelOptions}
                    updateStore={handleFieldChange}
                />
                <IconButton onClick={handleRefresh} size="small" sx={{ p: 0, '&:hover': { color: 'primary.main' } }} loading={isLoading} title="Refresh Models">
                    <RefreshIcon />
                </IconButton>
            </Box>
        </Box>
    )
}
