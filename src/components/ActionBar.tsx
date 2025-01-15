import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
//import IconButton from '@mui/material/IconButton'

//import WifiIcon from '@mui/icons-material/Wifi';
import { shallow } from 'zustand/shallow'
import { NodeState, useNodeState } from '../stores/nodeStore'
import { WebsocketState, useWebsocketState } from '../stores/websocketStore'
import config from '../../config';

// Icons
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GetAppIcon from '@mui/icons-material/GetApp';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import SvgIcon from '@mui/material/SvgIcon'

export default function AppToolbar() {
  const { setNodes, setEdges, toObject, setViewport } = useReactFlow();
  const theme = useTheme()
  const { exportGraph } = useNodeState((state: NodeState) => ({ exportGraph: state.exportGraph }), shallow);
  const { sid, isConnected } = useWebsocketState((state: WebsocketState) => ({ sid: state.sid, isConnected: state.isConnected }), shallow);
  const onRun = async () => {
    if (!isConnected) {
      console.error('Not connected to WebSocket server');
      return;
    }

    const graphData = exportGraph(sid ?? '');

    console.info(graphData);

    try {
      await fetch('http://' + config.serverAddress + '/graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphData),
      });
    } catch (error) {
      console.error('Error connecting to API server:', error);
    }
  }

  const onExport = useCallback(() => {
    const flow = toObject();
    const jsonString = JSON.stringify(flow, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workflow.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [toObject]);

  const onNew = useCallback(() => {
    // Clear the nodes and edges
    setNodes([]);
    setEdges([]);
    
    // Clear localStorage
    localStorage.removeItem('workflow');
    
    const defaultViewport = { x: 0, y: 0, zoom: 1 };
    localStorage.setItem('workflow', JSON.stringify({ nodes: [], edges: [], viewport: defaultViewport }));
    setViewport(defaultViewport);
  }, [setNodes, setEdges]);

  return (
    <Box sx={{
      backgroundColor: theme.palette.background.paper,
      padding: 1,
      borderBottom: `1px solid ${theme.palette.divider}`,
    }}>
      <Stack
        direction="row"
        spacing={0}
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Stack
          direction="row"
          spacing={0}
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 3 }}>
            <SvgIcon>
              <svg viewBox="0 0 28 12" style={{ width: '40px', height: '100%', marginRight: '4px' }} xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
                <path style={{ fill: `${theme.palette.primary.main}` }} d="M1.815 11.95c0-.08.421-.784.936-1.565 1.217-1.848 2.4-5.662 2.161-6.965-.29-1.577-1.831-1.974-3.759-.97-1.334.696-1.513.496-.524-.578C1.682.725 3.286.007 4.807 0 6.57-.008 7.485 1.07 7.149 2.866c-.07.373-.077.665-.052.682.026.018.683-.505 1.368-1.122C10.205.861 11.458.232 13.026.266c2.323.054 2.982 1.899 3.153 2.636l.233 1.008 1.067-1.027C19.471.963 21.347.29 22.372.233c1.025-.058 1.686.18 2.376.915 1.69 1.801 1.441 4.275-.753 7.237-.963 1.3-1.166 1.726-.822 1.724.56.082 2.803-.211 3.602-.475.801-.262 1.16-.602 1.22-.507.047.072-.253.528-.4.695-.388.431-1.228 1.447-3.416 1.87-1.432.276-3.066.272-7.87.011-5.772-.312-8.614-.405-13.131.207-.75.101-1.364.12-1.364.041zM7.704 9.96c5.39-.463 5.243-.537 5.872-1.863 1.538-3.246-.245-6.387-3.297-5.802-1.09.209-2.7 1.904-4.049 4.262a522.55 522.55 0 0 1-1.532 2.666c-.286.489-.418.888-.296.886.123 0 1.609-.004 3.302-.149zm14.219-.594c.924-.558 1.842-2.346 1.842-3.592 0-1.864-1.516-3.591-3.15-3.591-1.511 0-2.565.904-4.441 3.81-.958 1.483-1.918 2.724-2.028 2.877-.328.462.122.959 4.76 1.064 1.702.038 2.42-.209 3.017-.568z"/>
              </svg>
            </SvgIcon>
          </Box>

          <Box sx={{ mr: 3 }}>
            <Typography variant="h6" sx={{ fontSize: '20px', padding: '0px 4px' }}>
              Mellon
            </Typography>
          </Box>

          <Box>
          <Button
              variant="text"
              startIcon={<InsertDriveFileOutlinedIcon />}
              onClick={onNew}
              sx={{ mr: 1 }}  // Add margin between buttons
            >
              New
            </Button>
            <Button
              variant="text"
              startIcon={<GetAppIcon />}
              onClick={onExport}
            >
              Export
            </Button>
          </Box>
        </Stack>
        <Box>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={onRun}
            disabled={!isConnected}
            
            sx={{
              background: `linear-gradient(100deg, ${theme.palette.primary.main} 25%, #ff4259 90%)`,
              '&.Mui-disabled': {
                background: `linear-gradient(100deg, #6a6a6a, #303030)`,
                color: '#1a1a1a',
              }
            }}
          >
            Run
          </Button>
        </Box>
        <Box></Box>
      </Stack>
    </Box>
  )
}
