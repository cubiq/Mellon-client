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

export const categoryColors: Record<string, string> = {
  default: '#1a1a1a',
  primitive: '#1a1a1a',
  image: '#215fa0',
  latent: '#215fa0',
  text: '#357288',
  string: '#357288',
  sampler: '#ac2053',
  pipeline: '#ac2053',
  FluxTransformer2DModel: '#d512e7ff',
  embedding: '#ddab2c',
  SD3TextEncoders: '#8e089b',
  FluxTextEncoders: '#8e089b',
  T5EncoderModel: '#8e089b',
  loader: '#0c8b47',
  upscaler: '#584caa',
  image_filter: '#008c8c',
};

export function generateCategoryStyles() {
  const styles: Record<string, any> = {};

  Object.entries(categoryColors).forEach(([category, color]) => {
    styles[`.react-flow__edge.category-${category} .react-flow__edge-path, .react-flow__edge.selected.category-${category} .react-flow__edge-path`] = { stroke: color };
    styles[`li.category-${category}, .category-${category}>header, .react-flow__node.selected>.category-${category}`] = {
      borderColor: color,
      outlineColor: color,
    };
    styles[`.react-flow__handle.${category}-handle`] = { backgroundColor: color };
  });

  return styles;
}

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
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '.react-flow__handle': {
          backgroundColor: '#aaaaaa',
          outlineColor: '#121212',
        },
        ...generateCategoryStyles(),
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
  </StrictMode>
)
