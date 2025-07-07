import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WebsocketProvider } from './components/WebsocketProvider.tsx';
import { ReactFlowProvider } from '@xyflow/react';
import App from './App.tsx'

import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { closeSnackbar, SnackbarProvider } from 'notistack';
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import '@xyflow/react/dist/base.css';
import './App.css'
import Button from '@mui/material/Button';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffb300',
    },
    secondary: {
      main: '#293438',
    },
    background: {
      default: '#101010',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#f3f3f3',
    }
  },
  typography: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, monospace',
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: {
          '& .MuiNativeSelect-select': {
            fontSize: 14,
            lineHeight: 1,
            '& option': {
              fontSize: 18,
              fontFamily: 'JetBrains Mono, monospace',
            },
          },
          '& .MuiInputBase-inputMultiline': {
            fontSize: 14
          }
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          padding: 0,
          margin: 0,
          borderRadius: 0,
          background: 'transparent',
          boxShadow: 'none',
          '&:before': {
            transition: 'none',
            background: 'transparent',
          },
          '&.MuiAccordion-root:last-of-type': {
            borderRadius: 0,
            background: 'transparent',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          fontFamily: 'JetBrains Mono',
          fontSize: '14px',
          background: '#1a1a1a',
          minHeight: 0,
        },
        content: {
          my: 1,
          mx: 0,
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: 0,
          margin: 0,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          transition: 'none',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '.react-flow__handle': {
          backgroundColor: '#aaaaaa',
          outlineColor: '#121212',
        },
        // Default
        '.react-flow__edge.category-default .react-flow__edge-path': {
          stroke: '#1a1a1a',
        },
        'li.category-default, .category-default>header, .react-flow__node.selected>.category-default': {
          borderColor: 'rgb(100, 100, 100)',
          outlineColor: 'rgb(100, 100, 100)',
        },
        '.react-flow__handle.default-handle': {
          backgroundColor: '#1a1a1a',
        },
        // Primitive
        '.react-flow__edge.category-primitive .react-flow__edge-path': {
          stroke: '#1a1a1a',
        },
        'li.category-primitive, .category-primitive>header, .react-flow__node.selected>.category-primitive': {
          borderColor: 'rgb(100, 100, 100)',
          outlineColor: 'rgb(100, 100, 100)',
        },
        '.react-flow__handle.primitive-handle': {
          backgroundColor: '#1a1a1a',
        },
        // Image
        '.react-flow__edge.category-image path, .react-flow__edge.category-latent path': {
          stroke: '#215fa0',
        },
        'li.category-image, .category-image>header, .react-flow__node.selected>.category-image': {
          borderColor: 'rgb(21, 95, 160)',
          outlineColor: 'rgb(21, 95, 160)',
        },
        'li.category-latent, .category-latent>header, .react-flow__node.selected>.category-latent': {
          borderColor: 'rgb(21, 95, 160)',
          outlineColor: 'rgb(21, 95, 160)',
        },
        '.react-flow__handle.image-handle, .react-flow__handle.latent-handle': {
          backgroundColor: '#215fa0',
        },
        // Text
        '.react-flow__edge.category-text path, .react-flow__edge.category-string path': {
          stroke: '#357288',
        },
        'li.category-text, .category-text>header, .react-flow__node.selected>.category-text': {
          borderColor: 'rgb(53, 114, 136)',
          outlineColor: 'rgb(53, 114, 136)',
        },
        '.react-flow__handle.text-handle, .react-flow__handle.string-handle': {
          backgroundColor: '#357288',
        },
        // Sampler
        '.react-flow__edge.category-sampler .react-flow__edge-path, .react-flow__edge.category-pipeline .react-flow__edge-path': {
          stroke: 'rgb(172, 32, 83)',
        },
        'li.category-sampler, .category-sampler>header, .react-flow__node.selected>.category-sampler': {
          borderColor: 'rgb(172, 32, 83)',
          outlineColor: 'rgb(172, 32, 83)',
        },
        '.react-flow__handle.sampler-handle, .react-flow__handle.pipeline-handle': {
          backgroundColor: 'rgb(172, 32, 83)',
        },
        // Embedding
        '.react-flow__edge.category-embedding .react-flow__edge-path': {
          stroke: 'rgb(221, 171, 44)',
        },
        'li.category-embedding, .category-embedding>header, .react-flow__node.selected>.category-embedding': {
          borderColor: 'rgb(221, 171, 44)',
          outlineColor: 'rgb(221, 171, 44)',
        },
        '.react-flow__handle.embedding-handle': {
          backgroundColor: 'rgb(221, 171, 44)',
        },
        // Loader
        '.react-flow__edge.category-loader .react-flow__edge-path': {
          stroke: 'rgb(12, 139, 71)',
        },
        'li.category-loader, .category-loader>header, .react-flow__node.selected>.category-loader': {
          borderColor: 'rgb(12, 139, 71)',
          outlineColor: 'rgb(12, 139, 71)',
        },
        '.react-flow__handle.loader-handle': {
          backgroundColor: 'rgb(12, 139, 71)',
        },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={10}
        autoHideDuration={5000}
        preventDuplicate={true}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        style={{ maxWidth: '640px' }}
        action={(snackbarId) => (
          <><Button sx={{ height: '100%', width: '100%', position: 'absolute', left: 0, top: 0, opacity: 0 }} onClick={() => closeSnackbar(snackbarId)} /></>
      )}>
        <WebsocketProvider>
          <ReactFlowProvider>
            <App />
          </ReactFlowProvider>
        </WebsocketProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
)
