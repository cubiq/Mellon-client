import { useSettingsStore } from './stores/useSettingsStore';
import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton';

import WebAssetIcon from '@mui/icons-material/WebAsset';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import PolylineRoundedIcon from '@mui/icons-material/PolylineRounded';

import Workflow from './components/Workflow';
import TopBar from './components/TopBar';
import NodeList from "./components/NodeList";
import { useNodesStore } from './stores/useNodeStore';
import { useWebsocketStore } from './stores/useWebsocketStore.ts';

const TAB_BAR_WIDTH = 54;
const WORKSPACE_MIN_WIDTH = 240

export default function App() {
  const {
    isLeftPanelOpen,
    isRightPanelOpen,
    leftPanelWidth,
    leftPanelTabIndex,
    rightPanelWidth,
    setLeftPanelOpen,
    setLeftPanelWidth,
    setLeftPanelTabIndex,
    setRightPanelWidth,
  } = useSettingsStore();

  const { connect: websocketConnect, disconnect: websocketDisconnect } = useWebsocketStore();

  const { enqueueSnackbar } = useSnackbar();
  const { error: nodesStoreError, fetchNodes } = useNodesStore();
  const activePanelRef = useRef<'left' | 'right' | null>(null);

  const handlePanelResize = useCallback((e: MouseEvent) => {
    if (!activePanelRef.current) return;

    if (activePanelRef.current === 'left') {
      const newWidth = e.clientX - TAB_BAR_WIDTH;   
      const workspaceWidth = window.innerWidth - newWidth;

      if (workspaceWidth < WORKSPACE_MIN_WIDTH) {
        return;
      }

      setLeftPanelWidth(newWidth);
    } else if (activePanelRef.current === 'right') {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= WORKSPACE_MIN_WIDTH) {
        setRightPanelWidth(newWidth);
      } else {
        setRightPanelWidth(WORKSPACE_MIN_WIDTH);
      }
    }
  }, [setLeftPanelWidth, setRightPanelWidth]);

  const stopResize = useCallback(() => {
    document.querySelector('.mellon-resize-handle-active')?.classList.remove('mellon-resize-handle-active');
    activePanelRef.current = null;
    document.removeEventListener('mousemove', handlePanelResize);
    document.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = 'default';
  }, [handlePanelResize]);

  const startResize = useCallback((panel: 'left' | 'right', e: ReactMouseEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.classList.add('mellon-resize-handle-active');
    }
    activePanelRef.current = panel;
    document.addEventListener('mousemove', handlePanelResize);
    document.addEventListener('mouseup', stopResize);
    document.body.style.cursor = 'col-resize';
  }, [handlePanelResize, stopResize]);

  // Fetch nodes from API server
  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  // Connect to websocket server
  useEffect(() => {
    websocketConnect();

    return () => {
      websocketDisconnect();
    };
  }, [websocketConnect, websocketDisconnect]);

  // Log error if there is one
  useEffect(() => {
    if (nodesStoreError) {
      enqueueSnackbar(nodesStoreError, { variant: 'error', autoHideDuration: nodesStoreError.length * 80 });
    }
  }, [nodesStoreError, enqueueSnackbar]);

  // Cleanup listeners if component unmounts while resizing
  useEffect(() => {
    return () => {
      if (activePanelRef.current) {
        stopResize();
      }
    };
  }, [stopResize]);

  const handleTabChange = useCallback((index: number) => {
    if (index === leftPanelTabIndex) {
      setLeftPanelOpen(false);
      setLeftPanelTabIndex(-1);
    } else {
      setLeftPanelOpen(true);
      setLeftPanelTabIndex(index);
    }
  }, [setLeftPanelTabIndex, setLeftPanelOpen, leftPanelTabIndex]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Top Navigation Bar */}
        <Box sx={{ flex: 'none', backgroundColor: '#2a2a2a', color: 'white', height: '58px' }}>
          <TopBar />
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

          {/* Icon Tab Bar */}
          <Box sx={{
            bgcolor: 'background.default',
            width: `${TAB_BAR_WIDTH}px`,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            '& button': {
              borderRadius: 0,
              width: '54px',
              height: '50px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&.active': {
                backgroundColor: 'secondary.dark',
                color: 'primary.main',
              },
            },
          }}>
            <IconButton disableRipple className={leftPanelTabIndex === 0 ? 'active' : ''} onClick={() => handleTabChange(0)}>
              <WebAssetIcon />
            </IconButton>

            <IconButton disableRipple className={leftPanelTabIndex === 1 ? 'active' : ''} onClick={() => handleTabChange(1)}>
              <HomeRepairServiceIcon />
            </IconButton>

            <IconButton disableRipple className={leftPanelTabIndex === 2 ? 'active' : ''} onClick={() => handleTabChange(2)}>
              <PolylineRoundedIcon />
            </IconButton>
          </Box>

          {/* Left Panel */}
          <Box
            sx={{
              position: 'relative',
              flex: 'none',
              backgroundColor: '#0d0d0d',
              overflowY: 'auto',
              overflowX: 'hidden',
              width: isLeftPanelOpen ? `${leftPanelWidth}px` : '0px',
              borderRight: '1px solid #303030',
            }}
          >
            {leftPanelTabIndex === 0 && (
              <NodeList />
            )}

            {/* Resize handle */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '6px',
                height: '100%',
                cursor: 'col-resize',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                },
              }}
              onMouseDown={(e) => startResize('left', e)}
            />
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Workflow />
          </Box>

          {/* Right Panel */}
          <Box
            sx={{
              position: 'relative',
              flex: 'none',
              backgroundColor: 'background.default',
              overflowY: 'auto',
              overflowX: 'hidden',
              width: isRightPanelOpen ? `${rightPanelWidth}px` : '0px'
            }}
          >
            <h2>Gallery (TODO)</h2>
            
            {/* Resize handle */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6px',
                height: '100%',
                cursor: 'col-resize',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                },
              }}
              onMouseDown={(e) => startResize('right', e)}
            />
          </Box>
        </Box>
    </Box>
  );
}
