import { NodeProps, NodeResizeControl } from "@xyflow/react";
import { memo, useCallback, useState } from "react";
import { CustomNodeType, useFlowStore } from "../stores/useFlowStore";
import { NodeParams } from "../stores/useNodeStore";

import { deepEqual } from '../utils/deepEqual';
import { formatExecutionTime } from '../utils/formatExecutionTime';
import { formatMemory } from '../utils/formatMemory';
import NodeContent from "./NodeContent";

import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Button from "@mui/material/Button";

import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import TimerIcon from '@mui/icons-material/Timer';
import MemoryIcon from '@mui/icons-material/Memory';
import CircleIcon from '@mui/icons-material/Circle';
import config from "../../app.config";
import { enqueueSnackbar } from 'notistack';

const AnyNode = memo((node: NodeProps<CustomNodeType>) => {
  const style = node.data.style || {};
  const label = node.data.label || `${node.data.module} ${node.data.action}`;
  const setParam = useFlowStore((state) => state.setParam);
  const setNodeCached = useFlowStore((state) => state.setNodeCached);
  const [helpAnchorEl, setHelpAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [executionTimeAnchorEl, setExecutionTimeAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [memoryAnchorEl, setMemoryAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleUpdateStore = useCallback((param: string, value: any, key?: keyof NodeParams) => {
    setParam(node.id, param, value, key);
  }, [setParam, node.id]);

  const handleClearCache = useCallback(async () => {
    try {
      const response = await fetch(`${config.serverAddress}/cache`, { method: 'DELETE', body: JSON.stringify({ nodes: [node.id] }) });
        if (!response.ok) {
            throw new Error('Failed to delete cache');
        }
        setNodeCached(node.id, false);
        enqueueSnackbar('Cache cleared', { variant: 'success', autoHideDuration: 1500 });
    } catch (error) {
        console.error('Failed to delete cache', error);
    }
  }, [node.id]);

  return (
    <Box
      id={node.id}
      className={`${node.data.module}-${node.data.action} category-${node.data.category} module-${node.data.module}`}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        minWidth: "100px",
        minHeight: "100%",
        outlineOffset: "5px",
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: "transparent",
        borderRadius: "0",
        backgroundColor: "transparent",
        boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.3)",
        //overflow: "hidden",
        ...style,
      }}>

      {/* node header */}
      <Box component="header" sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'common.white',
        width: '100%',
        fontSize: '14px',
        borderTopWidth: '5px',
        borderTopStyle: 'solid',
        borderTopColor: 'text.secondary',
        p: 0.5, pl: 1,
        backgroundColor: 'background.default',
      }}>
        <Box sx={{ flexGrow: 1 }}>
          {label}
        </Box>
        <Box className="nodrag">
          <IconButton size="small" onClick={(e) => setHelpAnchorEl(e.currentTarget)}><HelpOutlineIcon sx={{ fontSize: '18px' }} /></IconButton>
          <Popover
            open={!!helpAnchorEl}
            onClose={() => setHelpAnchorEl(null)}
            anchorEl={helpAnchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  p: 1.5,
                  maxWidth: '480px',
                  bgcolor: 'secondary.dark',
                  backgroundImage: 'none',
                  ml: 2,
                  mt: -2,
                },
              },
            }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold', mb: 0.5 }}>{label}</Typography>
              <Typography sx={{ fontSize: '14px' }}>{node.data.description || 'No description available'}</Typography>
              {Object.entries(node.data.params).map(([key, param]) => (
                param.description ? (
                  <Box key={key} sx={{ mt: 0.5 }}>
                    <Typography sx={{ fontSize: '14px' }}><b>{param.label || key.charAt(0).toUpperCase() + key.slice(1)}:</b> {param.description}</Typography>
                  </Box>
                ) : null
              ))}
            </Popover>
        </Box>
      </Box>

      {/* node content */}
      <Box
        sx={{
          width: '100%',
          flexGrow: 1,
          p: 1,
          pb: 0,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          '& > .MuiBox-root': {
            mb: 1,
          },
      }}>
        <NodeContent nodeId={node.id} params={node.data.params} updateStore={handleUpdateStore} module={node.data.module || ''} />
      </Box>

      {/* node footer */}
      <Box sx={{
        position: 'relative',
        width: '100%',
        backgroundColor: 'background.default',
        color: 'text.secondary',
      }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress
            variant={(node.data.progress || 0) < 0 ? 'indeterminate' : 'determinate'}
            value={node.data.progress ?? 0}
            sx={{
              height: '4px',
              borderRadius: '0',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              '& .MuiLinearProgress-bar': {
                transition: 'none',
              },
              '& .MuiLinearProgress-bar1Determinate': {
                backgroundColor: 'primary.main',
                background: `linear-gradient(100deg, #ffb300 50%, #ff4259 90%)`,
              },
              '& .MuiLinearProgress-bar1Indeterminate, & .MuiLinearProgress-bar2Indeterminate': {
                background: `linear-gradient(100deg, #ffb300 50%, #ff4259 90%)`,
              },
            }}
          />
        </Box>
        <Box sx={{ p: 0.5, display: 'flex', alignItems: 'center', gap: 1, pr: '24px' }}>
          <IconButton
            size="small"
            sx={{ p: 0.5 }}
            disabled={!node.data.isCached}
            title={node.data.isCached ? 'Click to clear cache' : 'Not cached'}
            onClick={handleClearCache}
          >
            <CircleIcon sx={{ fontSize: '14px', color: node.data.isCached ? 'success.main' : 'text.secondary.dark' }} />
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MemoryIcon />}
            title='Peak memory usage'
            onClick={(e) => setMemoryAnchorEl(e.currentTarget)}
            sx={{
              minWidth: '0',
              minHeight: '0',
              px: 0.75,
              py: 0.5,
              borderRadius: 0.5,
              borderColor: 'secondary.main',
              color: 'text.secondary',
              textTransform: 'none',
              lineHeight: 1,
              '&:hover': {
                backgroundColor: 'secondary.dark',
              }
            }}
          >{node.data.memoryUsage?.last ? formatMemory(node.data.memoryUsage.last) : '-'}</Button>
          <Popover
            open={!!memoryAnchorEl}
            onClose={() => setMemoryAnchorEl(null)}
            anchorEl={memoryAnchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            slotProps={{
              paper: {
                sx: {
                  px: 1.5, py: 1,
                  bgcolor: 'secondary.dark',
                  backgroundImage: 'none',
                  mt: 0.5,
                },
              },
            }}
          >
            <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>Peak VRAM usage</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
              <Typography sx={{ width: '56px' }}>Last:</Typography><Typography>{formatMemory(node.data.memoryUsage?.last ?? 0)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
              <Typography sx={{ width: '56px' }}>Min:</Typography><Typography>{formatMemory(node.data.memoryUsage?.min ?? 0)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
              <Typography sx={{ width: '56px' }}>Max:</Typography><Typography>{formatMemory(node.data.memoryUsage?.max ?? 0)}</Typography>
            </Box>
          </Popover>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TimerIcon />}
            title='Execution time'
            onClick={(e) => setExecutionTimeAnchorEl(e.currentTarget)}
            sx={{
              minWidth: '0',
              minHeight: '0',
              px: 0.75,
              py: 0.5,
              borderRadius: 0.5,
              borderColor: 'secondary.main',
              color: 'text.secondary',
              textTransform: 'none',
              lineHeight: 1,
              '&:hover': {
                backgroundColor: 'secondary.dark',
              }
            }}
          >{node.data.executionTime?.last ? formatExecutionTime(node.data.executionTime.last) : '-'}</Button>
          <Popover
            open={!!executionTimeAnchorEl}
            onClose={() => setExecutionTimeAnchorEl(null)}
            anchorEl={executionTimeAnchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            slotProps={{
              paper: {
                sx: {
                  px: 1.5, py: 1,
                  bgcolor: 'secondary.dark',
                  backgroundImage: 'none',
                  mt: 0.5,
                },
              },
            }}
          >
            <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>Execution time</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
              <Typography sx={{ width: '56px' }}>Last:</Typography><Typography>{node.data.executionTime?.last ? formatExecutionTime(node.data.executionTime.last) : '-'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
              <Typography sx={{ width: '56px' }}>Min:</Typography><Typography>{node.data.executionTime?.min ? formatExecutionTime(node.data.executionTime.min) : '-'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
              <Typography sx={{ width: '56px' }}>Max:</Typography><Typography>{node.data.executionTime?.max ? formatExecutionTime(node.data.executionTime.max) : '-'}</Typography>
            </Box>
          </Popover>
        </Box>
      </Box>
      {/* resize control */}
      { node.data.resizable && (
        <NodeResizeControl minWidth={160} maxWidth={1280} maxHeight={1280} style={{ background: "transparent", border: "none" }}>
          <OpenInFullIcon sx={{
            cursor: 'se-resize',
            position: 'absolute',
            bottom: '1px',
            right: '1px',
            width: '24px',
            height: '24px',
            zIndex: 1000,
            transform: 'rotate(90deg)',
            opacity: 0,
            color: 'primary.main',
            '&:hover': {
              opacity: 1,
            },
          }}/>
        </NodeResizeControl>
      )}
    </Box>
  );
}, (prev, next) => {
  if (prev.data.executionTime?.last !== next.data.executionTime?.last) {
    return false;
  }
  if (prev.data.memoryUsage?.last !== next.data.memoryUsage?.last) {
    return false;
  }
  if (prev.data.isCached !== next.data.isCached) {
    return false;
  }
  if (prev.data.progress !== next.data.progress) {
    return false;
  }

  const prevParams = prev.data.params;
  const nextParams = next.data.params;
  const prevKeys = Object.keys(prevParams);
  const nextKeys = Object.keys(nextParams);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  if (!prevKeys.every(key => key in nextParams)) {
    return false;
  }

  for (const key of prevKeys) {
    const prevParam = prevParams[key];
    const nextParam = nextParams[key];

    if (!deepEqual(prevParam.value, nextParam.value)) {
      return false;
    }
    if (prevParam.disabled !== nextParam.disabled) {
      return false;
    }
    if (prevParam.hidden !== nextParam.hidden) {
      return false;
    }
    if (prevParam.isInput !== nextParam.isInput) {
      return false;
    }
  }

  return true;
});

export default AnyNode;

