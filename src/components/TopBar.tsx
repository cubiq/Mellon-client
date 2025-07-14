import { useCallback, useEffect, useRef, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '../stores/useFlowStore';
import config from '../../app.config';

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import CircularProgress from '@mui/material/CircularProgress';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useWebsocketStore } from '../stores/useWebsocketStore';
import { useTaskStore } from '../stores/useTaskStore';

import SvgIcon from '@mui/material/SvgIcon';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import RepeatIcon from '@mui/icons-material/Repeat';
import PhotoOutlinedIcon from '@mui/icons-material/PhotoOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import GetAppIcon from '@mui/icons-material/GetApp';
import SettingsIcon from '@mui/icons-material/Settings';
import StopIcon from '@mui/icons-material/Stop';


const executeOptions = [
  {
    label: 'Run',
    icon: <PlayArrowIcon />,
  },
  {
    label: 'Auto',
    icon: <AutoModeIcon />,
  },
  {
    label: 'Loop',
    icon: <RepeatIcon />,
  },  
]

function TopBar() {
  const executeGroupRef = useRef<HTMLDivElement>(null);
  const [executeButtonOpen, setExecuteButtonOpen] = useState(false);
  const { isRightPanelOpen, setRightPanelOpen, executeButtonIndex, setExecuteButtonIndex, setModelManagerOpener, setSettingsOpener } = useSettingsStore();
  const { isConnected, connect, disconnect } = useWebsocketStore();
  const { setViewport } = useReactFlow();
  const clearWorkflow = useFlowStore(state => state.clearWorkflow);
  const exportGraph = useFlowStore(state => state.exportGraph);
  const toObject = useFlowStore(state => state.toObject);
  const { sid } = useWebsocketStore();
  const { currentTask, taskCount } = useTaskStore();

  const handleExecuteMenuClick = () => {
    setExecuteButtonOpen(!executeButtonOpen);
  }

  const handleExecuteMenuClose = () => {
    setExecuteButtonOpen(false);
  }

  const handleExecuteOptionClick = (index: number) => {
    const i = Math.max(0, Math.min(index, executeOptions.length - 1));
    setExecuteButtonIndex(i);
    setExecuteButtonOpen(false);
  }

  const handleConnect = () => {
    if (isConnected) {
      return;
    }
    disconnect();
    connect();
  }

  const handleNewClick = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
    clearWorkflow();
  }, [clearWorkflow, setViewport]);

  const handleExportClick = useCallback(() => {
    const graph = toObject();
    const graphJson = JSON.stringify(graph);
    const blob = new Blob([graphJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [toObject]);

  const handleExecuteClick = async () => {
    if (!sid) {
      console.error('No session ID found');
      return;
    }

    if (!isConnected) {
      console.error('Not connected to websocket');
      return;
    }

    const graph = exportGraph(sid);

    try {
      const response = await fetch(`${config.serverAddress}/graph`, {
        method: 'POST',
        body: JSON.stringify(graph),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.error) {
        enqueueSnackbar(data.message, { variant: 'error', autoHideDuration: data.message.length * 80 });
        return;
      }
      console.info(data.message);
    } catch (error) {
      const err = `Error exporting graph: ${error}`;
      enqueueSnackbar(err, { variant: 'error', autoHideDuration: err.length * 80 });
      console.error(err);
    }
  }

  const handleStopClick = async () => {
    try {
      const response = await fetch(`${config.serverAddress}/stop`, {
        method: 'GET',
      });
      const data = await response.json();
      if (data.error) {
        console.warn(data.message);
        return;
      }
      enqueueSnackbar(data.message, { variant: 'success', autoHideDuration: data.message.length * 80 });
    } catch (error) {
      const err = `Error stopping the execution: ${error}`;
      enqueueSnackbar(err, { variant: 'error', autoHideDuration: err.length * 80 });
      console.error(err);
    }
  }

  useEffect(() => {
    // check if the index is valid
    if (executeButtonIndex < 0 || executeButtonIndex >= executeOptions.length) {
      setExecuteButtonIndex(0);
    }
  }, [executeButtonIndex]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: 2 }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <Box sx={{ marginRight: 1 }}>
          <img src="/assets/mellon.svg" alt="Mellon" width="36" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
        </Box>
        <Box><Typography variant="h6">Mellon</Typography></Box>

        <Button
          variant='text'
          size='small'
          startIcon={<InsertDriveFileOutlinedIcon />}
          sx={{ ml: 2 }}
          onClick={handleNewClick}
        >
          New
        </Button>
        <Button
          variant='text'
          size='small'
          startIcon={<GetAppIcon />}
          sx={{ ml: 1 }}
          onClick={handleExportClick}
        >
          Export
        </Button>
      </Box>
      {/* Actions */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
        <ButtonGroup variant="contained" ref={executeGroupRef} sx={{ '& .MuiButtonGroup-lastButton': { minWidth: '0px' } }}>
          <Button variant="contained" startIcon={executeOptions[executeButtonIndex].icon} disabled={!isConnected} onClick={handleExecuteClick}>
            {executeOptions[executeButtonIndex].label}
          </Button>
          <Button size="small" sx={{ p: 0 }} onClick={handleExecuteMenuClick} disabled={!isConnected}>
            <ArrowDropDownIcon />
          </Button>
        </ButtonGroup>
        <Popper
          open={executeButtonOpen}
          anchorEl={executeGroupRef.current}
          placement="bottom-end"
          disablePortal
          style={{ zIndex: 1000 }}
        >
          <Box sx={{ p: 0, backgroundColor: 'background.paper' }}>
            <ClickAwayListener onClickAway={handleExecuteMenuClose}>
              <MenuList autoFocusItem sx={{ p: 0, mt: 1 }}>
                {executeOptions.map((option, index) => (
                  <MenuItem
                    key={index}
                    selected={executeButtonIndex === index}
                    onClick={() => handleExecuteOptionClick(index)}
                  >
                    <ListItemIcon>{option.icon}</ListItemIcon>
                    {option.label}
                  </MenuItem>
                ))}
              </MenuList>
            </ClickAwayListener>
          </Box>
        </Popper>
        <Button
          title="Stop"
          variant="text"
          onClick={handleStopClick}
          disabled={!isConnected || !taskCount}
          sx={{
            minWidth: '0px',
            backgroundColor: `rgba(255, 255, 255, ${!isConnected || !taskCount ? '0.01' : '0.05'})`,
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            },
            px: 1
          }}
        >
          <StopIcon />
        </Button>

        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress color="success" variant="determinate" value={currentTask?.progress ?? 0} size={38} thickness={4} sx={{ borderRadius: '50%', boxShadow: 'inset 0 0 0 4px rgba(255, 255, 255, 0.12)', '& .MuiCircularProgress-circle': { transition: '60ms' } }} />
          <Box sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" component="div" color="text.secondary" sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              {(taskCount < 100 ? taskCount || '0' : '99+')}
            </Typography>
          </Box>
        </Box>
      </Box>
      {/* Options */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
        <IconButton
          title="Models"
          onClick={() => setModelManagerOpener({ nodeId: null, fieldKey: null })}
        >
        <SvgIcon>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        </SvgIcon>
        </IconButton>
        <IconButton
          title="Settings"
          onClick={() => setSettingsOpener(true)}
        >
          <SettingsIcon />
        </IconButton>
        <IconButton
          onClick={() => setRightPanelOpen(!isRightPanelOpen)}
          title="Gallery"
          sx={{
            backgroundColor: isRightPanelOpen ? 'secondary.light' : 'transparent'
          }}
        >
          <PhotoOutlinedIcon />
        </IconButton>
        <IconButton
          title={isConnected ? 'Connected' : 'Disconnected'}
          sx={{
            color: isConnected ? 'success.main' : 'error.main',
          }}
          onClick={handleConnect}
        >
          {isConnected ? <SignalWifi4BarIcon /> : <SignalWifiOffIcon />}
        </IconButton>
      </Box>
    </Box>
  )
}

export default TopBar;