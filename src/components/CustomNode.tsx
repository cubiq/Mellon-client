import { memo } from 'react';
import { NodeProps, NodeResizeControl } from '@xyflow/react';
import { shallow } from 'zustand/shallow';

// MUI components
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

// Icons
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import LinearProgress from '@mui/material/LinearProgress';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

import config from '../../config';
import { groupParams } from './utils/groupParams';
import { useNodeState, NodeState, CustomNodeType, NodeParams } from '../stores/nodeStore';
import { useWebsocketState } from '../stores/websocketStore';
import NodeContent from './NodeContent';

import { deepEqual } from './utils/deepEqual';

const CustomNode = memo((props: NodeProps<CustomNodeType>) => {
    const theme = useTheme();
    const { setParam, setNodeExecuted } = useNodeState((state: NodeState) => ({
        setParam: state.setParam,
        setNodeExecuted: state.setNodeExecuted
    }), shallow);

    const nodeProgress = useWebsocketState(
        (state) => state.nodeProgress[props.id] || { value: 0, type: 'determinate' },
        shallow
    );

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

    const nodeId = props.id;
    const nodeTitle = props.data.label;

    // format grouped fields
    const fieldList = groupParams(props.data.params);

    //const nodeContent = Object.entries(fieldList).map(([key, data]) => renderNodeContent(nodeId, key, data, setParam));
    const style = props.data.style || {};

    const updateStore = (param: string, value: any, key?: keyof NodeParams) => {
        setParam(nodeId, param, value, key);
    };

    const resizeControl = (
        <NodeResizeControl style={{ backgroundColor: 'transparent', border: 'none' }} minWidth={200} minHeight={8}>
            <OpenInFullIcon sx={{
                position: 'absolute',
                right: '-6px',
                bottom: '-6px',
                transform: 'rotate(90deg)',
                width: '26px',
                height: '26px',
                backgroundColor: theme.palette.background.default,
                borderRadius: '0',
                padding: '2px',
                color: theme.palette.text.secondary,
            }} />
        </NodeResizeControl>
    );

    return (
        <Box
            id={nodeId}
            className={`${props.data.module}-${props.data.action} category-${props.data.category} module-${props.data.module}`}
            sx={{
                position: 'relative',
                boxShadow: 4,
                outlineOffset: '5px',
                borderRadius: '0',
                minWidth: '200px',
                ...style,
            }}
        >
            {props.data.resizable && resizeControl}

            <Box
                component="header"
                sx={{
                    color: theme.palette.common.white,
                    padding: 1,
                    borderTopWidth: '6px',
                    borderTopStyle: 'solid',
                    borderTopColor: 'rgba(0, 0, 0)',
                    backgroundColor: theme.palette.background.default,
                    fontSize: '16px',
                    textShadow: '0px 2px 0px rgba(0, 0, 0, 0.75)',
                }}
            >
                {nodeTitle}
            </Box>
            <Box sx={{
                backgroundColor: theme.palette.background.paper,
                pl: 1, pr: 1, pt: 1, pb: 0,
                '& > .MuiBox-root': {
                    pb: 1.5,
                },
                '& .MuiAccordionDetails-root > .MuiBox-root': {
                    pb: 1.5,
                },
                '& .MuiStack-root > .MuiBox-root': {
                    pb: 1.5,
                },
                '& .numberField > .MuiBox-root': {
                    pb: 0,
                },
                '& .labelled-group': {
                    pb: 0,
                },
            }}
            >
                <NodeContent
                    fields={fieldList}
                    updateStore={updateStore}
                    groups={props.data.groups}
                />
            </Box>
            <Box
                component="footer"
                sx={{
                    p: 0,
                    backgroundColor: theme.palette.background.default,
                }}
            >
                <Box sx={{ width: '100%' }}>
                    <LinearProgress
                        variant={nodeProgress.type === 'indeterminate' ? 'indeterminate' : 'determinate'}
                        color="inherit"
                        value={nodeProgress.value}
                        className={nodeProgress.type === 'disabled' ? 'progress-disabled' : ''}
                        sx={{
                            height: '4px',
                            '&.progress-disabled': {
                                '& .MuiLinearProgress-bar': {
                                    display: 'none',
                                },
                            },
                            '& .MuiLinearProgress-bar1Indeterminate': {
                                background: `repeating-linear-gradient(45deg, ${theme.palette.primary.main} 0, ${theme.palette.primary.main} 20px, ${theme.palette.primary.dark} 20px, ${theme.palette.primary.dark} 40px)`,
                                backgroundSize: '60px 100%',
                                backgroundPosition: '0 0',
                                left: '0', right: '0',
                                animation: 'mellon-progress-ind 1s linear infinite',
                            },
                            '& .MuiLinearProgress-bar1Determinate': {
                                transitionDuration: '80ms',
                                background: `linear-gradient(100deg, ${theme.palette.primary.main} 50%, #ff4259 90%)`,
                            },
                            '& .MuiLinearProgress-bar2Indeterminate': {
                                display: 'none',
                                animation: 'none',
                            },
                         }}
                    />
                </Box>

                <Box sx={{ p: 1 }}>
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                            pr: props.data.resizable ? 2.5 : 0,
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
                                '& .MuiChip-icon': {
                                    fontSize: '18px',
                                },
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
                                '& .MuiChip-icon': {
                                    fontSize: '18px',
                                    color: theme.palette.text.secondary,
                                },
                            }}
                        />
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}, (prevProps, nextProps) => {
    if (prevProps.data.time !== nextProps.data.time) {
        return false;
    }
    if (prevProps.data.cache !== nextProps.data.cache) {
        return false;
    }

    if (!deepEqual(prevProps.data.groups, nextProps.data.groups)) {
        return false;
    }

    const prevParams = prevProps.data.params;
    const nextParams = nextProps.data.params;

    const prevKeys = Object.keys(prevParams);
    const nextKeys = Object.keys(nextParams);

    // Check if the objects have different number of keys
    if (prevKeys.length !== nextKeys.length) {
        return false;
    }

    // Check if all keys match
    if (!prevKeys.every(key => key in nextParams)) {
        return false;
    }

    // Now check the values for each key
    for (const key of prevKeys) {
        const prev = prevParams[key];
        const next = nextParams[key];

        if (!deepEqual(prev.value, next.value) ||
            prev.disabled !== next.disabled ||
            prev.hidden !== next.hidden) {
            return false;
        }
    }

    return true;
});

export default CustomNode;
