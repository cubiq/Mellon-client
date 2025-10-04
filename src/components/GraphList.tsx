import { useEffect, useState, useMemo, useCallback } from 'react';
import config from '../../app.config';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import Collapse from '@mui/material/Collapse';
import SearchIcon from '@mui/icons-material/Search';
import OutlinedInput from '@mui/material/OutlinedInput';
import ReplayIcon from '@mui/icons-material/Replay';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

export interface GraphData {
  isDir: boolean;
  path: string;
  name: string;
  children?: GraphData[];
}

function GraphList() {
  const [isLoading, setIsLoading] = useState(false);
  const [graphs, setGraphs] = useState<GraphData[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const fetchGraphs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.serverAddress}/listgraphs`);
      const data = await response.json();
      if (data.error) {
        console.error('Error fetching graphs:', data.error);
        setGraphs([]);
      } else {
        setGraphs(data || []);
      }
    } catch (error) {
      console.error('Error fetching graphs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch graphs on component mount
  useEffect(() => {
    fetchGraphs();
  }, [fetchGraphs]);

  const toggleDir = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const filteredGraphs = useMemo(() => {
    if (!search) {
      return graphs;
    }

    const getAllFiles = (nodes: GraphData[]): GraphData[] => {
      let files: GraphData[] = [];
      const traverse = (node: GraphData) => {
        if (node.isDir) {
          if (node.children) {
            node.children.forEach(traverse);
          }
        } else {
          files.push(node);
        }
      };
      nodes.forEach(traverse);
      return files;
    };

    const allFiles = getAllFiles(graphs);
    return allFiles.filter(file =>
      file.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, graphs]);

  const renderDir = (node: GraphData, level = 0) => {
    if (node.isDir && !search) {
      const isOpen = expanded.has(node.path);
      const children = node.children || [];
      return (
        <Box key={node.path}>
          <ListItemButton
            dense
            disableGutters
            onClick={() => toggleDir(node.path)}
            sx={{ pl: 2 + level * 2 }}
            disableRipple
          >
            <ListItemIcon sx={{ minWidth: '0', pr: 1 }}>
              {isOpen ? <FolderOpenIcon sx={{ color: 'primary.dark' }} /> : <FolderIcon sx={{ color: 'primary.dark' }} />}
            </ListItemIcon>
            <ListItemText primary={node.name} />
          </ListItemButton>

          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List dense disablePadding>
              {children.map(child => renderDir(child, level + 1))}
            </List>
          </Collapse>
        </Box>
      );
    } else if (!node.isDir) {
      return (
        <ListItem dense disablePadding disableGutters key={node.path} sx={{ pl: 2 + (search ? 0 : level) * 2 }}>
          <ListItemText
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', node.path);
              e.dataTransfer.effectAllowed = 'move';
            }}
            sx={{ cursor: 'grab' }}
            primary={node.name}
          />
        </ListItem>
      );
    }
    return null;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <OutlinedInput
          placeholder="Search"
          fullWidth
          size="small"
          startAdornment={<SearchIcon fontSize="small" sx={{ mr: 0.5 }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <IconButton
          size="small"
          title="Reload graphs"
          color="primary"
          disabled={isLoading}
          onClick={() => { fetchGraphs(); setExpanded(new Set()); setSearch(''); }}
        >
          {isLoading ? <CircularProgress size={24} /> : <ReplayIcon fontSize="medium" />}
        </IconButton>
      </Box>

      {isLoading ? (
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>Loading...</Box>
      ) : (
        <List dense disablePadding sx={{ userSelect: 'none' }}>
          {filteredGraphs.map(item => renderDir(item, 0))}
        </List>
      )}
    </Box>
  );
}

export default GraphList;