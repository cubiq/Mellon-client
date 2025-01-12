import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {ReactFlowProvider } from '@xyflow/react'

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";

import { WebSocketProvider } from './components/WebsocketContext';

const themeOptions = createTheme({
  components: {
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          fontFamily: 'JetBrains Mono',
        },
      },
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffb300',
    },
    secondary: {
      main: '#00695f',
    },
    background: {
      default: '#121212',
      paper: '#1a1a1a',
    },
  },
  typography: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
  },
  /* Disable all transitions
  transitions: {
    create: () => 'none',
  }
  */
});

import App from './App.tsx'
import Box from '@mui/material/Box';
import ToolBar from './components/ToolBar.tsx';
import ActionBar from './components/ActionBar.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={themeOptions}>
      <CssBaseline />
      <ReactFlowProvider>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
        }}>
          <ActionBar />
          <Box sx={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            height: '100%',
          }}>
            <ToolBar />
            <Box sx={{ flex: 1, height: '100%' }}>
              <WebSocketProvider>
                <App />          
              </WebSocketProvider>
            </Box>
          </Box>
        </Box>
      </ReactFlowProvider>
    </ThemeProvider>
  </StrictMode>
)
