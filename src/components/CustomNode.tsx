import React, { lazy, useState, MouseEvent, useEffect, Suspense } from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { styled, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import CustomNumberInput from './CustomNumberInput';
import config from '../../config';
import { useNodeState, NodeState, CustomNodeType } from '../stores/nodeStore';
import { shallow } from 'zustand/shallow';
import Stack from '@mui/material/Stack';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';

//import TextareaAutosize from '@mui/material/TextareaAutosize';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import IconButton from '@mui/material/IconButton';

// Icons
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Autocomplete from '@mui/material/Autocomplete';

// lazy loading
const ThreePreview = lazy(() => import('./ThreePreview'));

const PlainAccordion = styled(Accordion)(({ theme }) => ({
    boxShadow: 'none',
    border: 0,
    padding: 0,
    margin: 0,
    background: 'transparent',
    borderTop: `1px solid ${theme.palette.divider}`,
    '&:before': { background: 'transparent' },
    '.MuiAccordionSummary-root': { padding: '12px 4px', margin: 0, background: 'transparent', color: theme.palette.text.secondary, minHeight: '0' },
    '.MuiAccordionDetails-root': { padding: 0, margin: 0 },
    '.MuiAccordionSummary-root:hover, .MuiAccordionSummary-root:hover .MuiAccordionSummary-expandIconWrapper': { color: theme.palette.primary.main },
}));


// const CustomTextarea = styled(TextareaAutosize)(() => ({
//     fontSize: '13px',
//     padding: '4px',
// }));
const DynamicComponent = ({ component, props }: { component: string, props: any }) => {
    const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

    useEffect(() => {
        const script = document.createElement('script');

        const loadComponent = async () => {
            try {
                const url = `http://${config.serverAddress}/custom_component/${component}`;
                script.src = url;
                script.async = true;

                (window as any).React = React;

                // Wait for script to load
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });

                const LoadedComponent = (window as any).MyComponent;
                setComponent(() => LoadedComponent);
            } catch (error) {
                console.error('Error loading component:', error);
            }
        };

        loadComponent();

        // Cleanup
        return () => {
            document.body.removeChild(script);
        };
    }, [component]);

    if (!Component) {
        return <div>Loading component: {component}...</div>;
    }

    return <Component {...props} />;
};

const renderNodeContent = (nodeId: string, key: string, props: any, onValueChange: (nodeId: string, changeKey: string, changeValue: any) => void) => {
    let field;
    let fieldType = props.display || '';
    const theme = useTheme();

    const style = props.style || {};

    if (fieldType === 'group') {
        if (props.label) {
            field = (
                <Box sx={{ borderBottom: `2px solid ${theme.palette.divider}`, p: 0, mb: 1 }}>
                    <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{props.label}</Typography>
                    <Stack direction="row" spacing={1} key={key} sx={{ justifyContent: "space-between", alignItems: "center", mt: 0.5, mb: 1 }}>
                        {Object.entries(props.params).map(([gkey, gdata]) => renderNodeContent(nodeId, gkey, gdata, onValueChange))}
                    </Stack>
                </Box>
            );
        } else {
            field = (
                <Stack direction="row" spacing={1} key={key} sx={{ justifyContent: "space-between", alignItems: "center", mt: 0, mb: 0 }}>
                    {Object.entries(props.params).map(([gkey, gdata]) => renderNodeContent(nodeId, gkey, gdata, onValueChange))}
                </Stack>
            );
        }
        return field;
    }

    if (fieldType === 'collapse') {
        field = (
            <PlainAccordion key={key} disableGutters={true} square={true}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ border: 'none' }}>
                    {props.label || key}
                </AccordionSummary>
                <AccordionDetails sx={{ border: 'none' }}>
                    {Object.entries(props.params).map(([gkey, gdata]) => renderNodeContent(nodeId, gkey, gdata, onValueChange))}
                </AccordionDetails>
            </PlainAccordion>
        )
        return field;
    }

    // Data type can be an array, the array is mostly used for input handles to allow multiple types
    // For node processing we only use the first type, that is the main type
    // TODO: should we use an "allowedTypes" property instead?
    const dataType = Array.isArray(props.type) && props.type.length > 0 ? props.type[0] : props.type;

    if ( fieldType !== 'input' && fieldType !== 'output') {
        if (!fieldType && props.options && typeof props.options === 'object') {
            fieldType = 'select';
        } else if (dataType === 'boolean') {
            fieldType = fieldType !== 'checkbox' ? 'switch' : fieldType;
        } else if (!fieldType && (dataType === 'int' || dataType === 'integer' || dataType === 'float' || dataType === 'number')) {
            fieldType = props.display === 'slider' ? 'slider' : 'number';
        } else if (fieldType === 'ui') {
            if (dataType === 'image') {
                fieldType = 'ui_image';
            } else if (dataType.toLowerCase() === 'dropdownicon') {
                fieldType = 'ui_dropdownicon';
            } else if (dataType.toLowerCase() === '3d') {
                fieldType = 'ui_3d';
            }
        } else if (!fieldType) {
            fieldType = 'text';
        }
    }

    switch (fieldType) {
        case 'input':
            field = (
                <Box key={key} sx={{ pt: 1, pb: 1, position: 'relative', ...style }}>
                    <Handle
                        id={key}
                        type="target"
                        position={Position.Left}
                        className={`${dataType}-handle`}
                    />
                    <Box sx={{ paddingLeft: 1 }}>{props.label || key}</Box>
                </Box>
            );
            break;
        case 'output':
            field = (
                <Box key={key} sx={{ pt: 1, pb: 1, position: 'relative', ...style }}>
                    <Handle
                        id={key}
                        type="source"
                        position={Position.Right}
                        className={`${dataType}-handle`}
                    />
                    <Box sx={{ textAlign: 'right', paddingRight: 1 }}>{props.label || key}</Box>
                </Box>
            );
            break;
        case 'textarea':
            field = (
                <Box key={key} sx={{ pt: 1, pb: 1, minWidth: '320px', ...style }}>
                    <TextField
                        onChange={(e) => onValueChange(nodeId, key, e.target.value)}
                        variant="outlined"
                        type="text"
                        size="small"
                        fullWidth
                        multiline
                        rows={3}
                        label={props.label || key}
                        value={props.value || props.default || ''}
                        sx={{ '& textarea': { fontSize: '13px' } }}
                        className="nodrag nowheel"
                    />
                </Box>
            );
            break;
        case 'select':
            const selectValue = props.value || props.default || '';

            field = (
                <Box key={key} sx={{ pt: 1, pb: 1, ...style }}>
                    <TextField
                        onChange={(e) => onValueChange(nodeId, key, e.target.value)}
                        variant="outlined"
                        fullWidth
                        size="small"
                        select
                        label={props.label || key}
                        value={selectValue}
                        slotProps={{
                            select: {
                                native: true,
                                sx: { fontSize: '14px' },
                            },
                        }}
                        helperText={props.help || ''}
                    >
                        {Array.isArray(props.options) ? (
                            props.options.map((v: any, i: number) => (
                                <option key={i} value={v}>
                                    {v}
                                </option>
                            ))
                        ) : (
                            Object.entries(props.options).map(([k, v]: any) => (
                                <option key={k} value={k}>
                                    {typeof v === 'object' ? v.label : v}
                                </option>
                            ))
                        )}
                    </TextField>
                </Box>
            );
            break;
        case 'autocomplete':
            field = (
                <Box key={key} sx={{ pt: 1, pb: 1, minWidth: '320px', ...style }} className="nodrag nowheel">
                    <Autocomplete
                        disablePortal
                        freeSolo={props.no_validation ? true : false}
                        options={props.options || []}
                        renderInput={(params: any) => <TextField {...params} label={props.label || key} />}
                        onChange={(_, value) => onValueChange(nodeId, key, value)}
                        value={props.value || props.default || ''}
                        size="small"
                        sx={{ '& + .MuiAutocomplete-popper .MuiAutocomplete-option': { fontSize: '12px' } }}
                    />
                </Box>
            );
            break;
        case 'switch':
            field = (
                <Box key={key} sx={{ ml: '-8px', ...style }}>
                    <FormGroup>
                        <FormControlLabel
                            sx={{ m: 0}}
                            control={<Switch
                                color="secondary"
                                defaultChecked={props.default || false}
                                onChange={(e) => onValueChange(nodeId, key, e.target.checked)}
                            />}
                            label={props.label || key}
                        />
                    </FormGroup>
                </Box>
            );
            break;
        case 'ui_image':
            field = (
                <Box key={key} sx={{ ...style }}>
                    <img src={props.value || props.default || ''} alt={props.label || key} data-key={key} />
                </Box>
            );
            break;
        case 'ui_3d':
            field = (
                <Box key={key} sx={{ p: 0, m: 0, mt: 1, mb: 1, ...style }} className="nodrag nowheel">
                    <Suspense fallback={<div>Loading 3D viewer...</div>}>
                        <ThreePreview
                            nodeId={nodeId}
                            dataKey={key}
                            value={props.value || props.default || ''}
                            width={512}
                            height={512}
                        />
                    </Suspense>
                </Box>
            );
            break;
        case 'ui_dropdownicon':
            const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
            const open = Boolean(anchorEl);
            const targetField = Array.isArray(props.target) ? props.target : [props.target];
            const targetElements = targetField.map((field: string) => anchorEl?.parentNode?.parentNode?.querySelector(`[data-id="${field}"]`));

            const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
              setAnchorEl(event.currentTarget);
            };
            const handleMenuItemClick = (i: number) => {
                setAnchorEl(null);
                if (i<0) return;

                const targetValue = Array.isArray(props.options[i].value) ? props.options[i].value : [props.options[i].value];

                targetElements.forEach((el: HTMLElement, index: number) => {
                    if (el && el.dataset && el.dataset.key) {
                        onValueChange(nodeId, el.dataset.key, targetValue[index]);
                    }
                });
            };

            field = (
                <Box key={key} className="nodrag nowheel" sx={{ ...style }}>
                    <IconButton
                        aria-label="more"
                        aria-haspopup="true"
                        onClick={handleClick}
                        title={props.label || key}
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={() => handleMenuItemClick(-1)}
                        slotProps={{
                            paper: {
                                sx: {
                                    boxShadow: "0px 4px 8px 2px rgba(0, 0, 0, 0.5)",
                                    backgroundColor: theme.palette.secondary.dark,
                                },
                            },
                        }}
                    >
                        {props.options.map((option: any, i: number) => (
                            <MenuItem key={i} onClick={() => handleMenuItemClick(i)}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>
            );
            break;
        case 'slider':
        case 'number':
            field = (
                <CustomNumberInput
                    key={key}
                    value={props.value || props.default || 0}
                    label={props.label || key}
                    dataType={dataType}
                    min={props.min}
                    max={props.max}
                    step={props.step}
                    slider={fieldType === 'slider'}
                    onChange={(newValue) => onValueChange(nodeId, key, newValue)}
                    style={style}
                />
            );
            break;
        case 'custom':
            const nodeActions = {
                setValue: (cvalue: any) => onValueChange(nodeId, key, cvalue),
                // TODO: we might need more actions in the future
            };

            field = (
                <Box key={key} sx={{ pt: 1, pb: 1, ...style }}>
                    <DynamicComponent
                        component={props.component}
                        props={{
                            ...props,
                            nodeActions,
                            nodeId,
                        }}
                    />
                </Box>
            );
            break;
        default:
            field = (
                <Box key={key} sx={{ pt: 1, pb: 1, mb: 0, '& input': { fontSize: '14px', ...style } }}>
                    <TextField
                        data-id={key}
                        data-key={key}
                        onChange={(e) => onValueChange(nodeId, key, e.target.value)}
                        variant="outlined"
                        type={fieldType}
                        size="small"
                        fullWidth
                        label={props.label || key}
                        value={props.value || props.default || ''}
                        className="nodrag"
                        autoComplete="off"
                        sx={ (dataType === 'int' || dataType === 'integer' || dataType === 'float' || dataType === 'number') ? { '& input': { textAlign: 'right' } } : {} }
                    />
                </Box>
            );
    }

    return field;
}

const CustomNode = (props: NodeProps<CustomNodeType>) => {
    const theme = useTheme();
    const { setParamValue, setNodeExecuted } = useNodeState((state: NodeState) => ({ setParamValue: state.setParamValue, setNodeExecuted: state.setNodeExecuted }), shallow);

    //const onValueChange = (nodeId: string, key: string, value: any) => {
    //    setParamValue(nodeId, key, value);
    //}
    const onClearCache = async () => {
        const nodeId = props.id;

        try {
            const response = await fetch('http://' + config.serverAddress + '/clearNodeCache', {
                method: 'DELETE',
                body: JSON.stringify({ nodeId }),
            });

            if (response.ok) {
                setNodeExecuted(nodeId, false, 0, 0);
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    // Group fields by data.params.group. Convert group from:
    // 'seed': { ... }, 'width': { ... group: 'dimensions' }, 'height': { ... group: 'dimensions' }
    // To:
    // 'seed': { ... }, 'dimensions_group': { ... , 'params': { 'width': { ... }, 'height': { ... } } }
    // This complication is done to keep all fields on the same level and avoid nested objects
    const groupedParams = Object.entries(props.data.params).reduce((acc: any, [key, data]) => {
        let group = undefined;

        if (data.group) {
            if (typeof data.group === 'string') {
                group = {
                    key: data.group + '_group',
                    //display: 'group'
                }
            } else {
                group = {
                    key: (data.group.key || 'untitled') + '_group',
                    display: data.group.display || 'group',
                    label: data.group.label || null,
                }
            }
        }

        if (!group) {
            acc[key] = data;
        } else {
            if (!acc[group.key]) {
                acc[group.key] = { display: group.display || 'group', label: group.label || null, params: {} };
            }
            acc[group.key].params[key] = data;
        }

        return acc;
    }, {});

    const fields = Object.entries(groupedParams).map(([key, data]) => renderNodeContent(props.id, key, data, setParamValue));
    const style = props.data.style || {};

    return (
        <Box
            id={props.id}
            className={`${props.data.module}-${props.data.action} category-${props.data.category} module-${props.data.module}`}
            sx={{
                fontSize: '14px',
                boxShadow: 4,
                outlineOffset: '5px',
                borderRadius: '0',
                ...style,
            }}
        >
            <Box
                component="header"
                sx={{
                    //fontWeight: '700',
                    color: theme.palette.common.white,
                    padding: '8px 10px 8px 10px',
                    borderTopWidth: '6px',
                    borderTopStyle: 'solid',
                    borderTopColor: 'rgba(0, 0, 0, 0.2)',
                    backgroundColor: '#121212',
                    //borderTopLeftRadius: 4,
                    //borderTopRightRadius: 4,
                    fontSize: '15px',
                    textShadow: '0px 2px 0px rgba(0, 0, 0, 0.75)',
                }}
            >
                {props.data.label}
            </Box>
            <Box
                //component="form"
                //noValidate
                //autoComplete="off"
                sx={{
                    //borderTop: '4px solid rgba(0, 0, 0, 0.2)',
                    backgroundColor: theme.palette.background.paper,
                    paddingLeft: 1,
                    paddingRight: 1,
                    paddingTop: '4px',
                }}
            >
                {fields}
            </Box>
            <Box
                component="footer"
                sx={{
                    padding: 1,
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.secondary,
                    borderTop: `2px solid ${theme.palette.divider}`,
                    //borderBottomLeftRadius: 4,
                    //borderBottomRightRadius: 4,
                    ".MuiChip-icon": { fontSize: '14px' },
                }}
            >
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Chip
                        icon={<DeleteForeverIcon />}
                        label="Cache"
                        title="Clear Cache"
                        onClick={onClearCache}
                        disabled={!props.data.cache}
                        color="secondary"
                        variant="filled"
                        sx={{
                            height: '24px',
                            borderRadius: 0.5,
                            fontSize: '12px',
                            span: { padding: '0px 8px 0px 10px' },
                        }}
                    />
                    {/* <Chip
                        icon={<MemoryIcon />}
                        label={props.data.memory ? `${props.data.memory}` : '0Mb'}
                        title="Memory Usage"
                        sx={{
                            color: theme.palette.text.secondary,
                            height: '24px',
                            borderRadius: 0.5,
                            fontSize: '12px',
                            span: { padding: '0px 8px 0px 10px' },
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                    /> */}
                    <Chip
                        icon={<AccessAlarmIcon />}
                        label={props.data.time ? `${props.data.time}s` : '-'}
                        title="Execution Time"
                        sx={{
                            color: theme.palette.text.secondary,
                            height: '24px',
                            borderRadius: 0.5,
                            fontSize: '12px',
                            span: { padding: '0px 8px 0px 10px' },
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                    />
                </Stack>
            </Box>
        </Box>
    );
}

export default CustomNode;