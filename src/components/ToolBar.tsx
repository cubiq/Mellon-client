import { useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
//import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'

//import ToggleButton from '@mui/material/ToggleButton'
//import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
//import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'

import { shallow } from 'zustand/shallow';
import { NodeRegistryState, useNodeRegistryState } from '../stores/nodeRegistryStore';

import OutlinedInput from '@mui/material/OutlinedInput'
import SearchIcon from '@mui/icons-material/Search'
import Accordion from '@mui/material/Accordion'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const sidebarWidth = 260

const selectNodeRegistryState = (state: NodeRegistryState) => ({
  nodeRegistry: state.nodeRegistry,
});

const groupBy = (field: string, nodeRegistry: any) => {
  const grouped = Object.entries(nodeRegistry).reduce((acc: any, [key, node]: [string, any]) => {
    const fieldValue = node[field] || 'default';
    if (!acc[fieldValue]) {
      acc[fieldValue] = [];
    }
    acc[fieldValue].push({ key, ...node });
    return acc;
  }, {});

  if (field !== 'module') {
    // Sort nodes within each module alphabetically by label
    Object.keys(grouped).forEach(module => {
      grouped[module].sort((a: any, b: any) => 
        (a.label || a.key).localeCompare(b.label || b.key)
      );
    });
  }

  // Return as sorted object with sorted module names
  return Object.fromEntries(
    Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  );
};

export default function LeftSidebar() {
  const theme = useTheme()
  const { nodeRegistry } = useNodeRegistryState(selectNodeRegistryState, shallow);

  // Local node search state, the code will hide the nodes that don't match the search term instead of removing them from the DOM
  const [searchTerm, setSearchTerm] = useState('')
  const filteredNodes = useMemo(() => {
    const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    if (searchTerms.length === 0) return null;

    return Object.keys(nodeRegistry).filter((key) => {
      const label = nodeRegistry[key].label.toLowerCase();
      return searchTerms.every(term => label.includes(term));
    })
  }, [nodeRegistry, searchTerm])

  // Drag and drop functionality
  const onDragStart = (event: React.DragEvent<HTMLLIElement>, key: string) => {
    event.dataTransfer.setData('text/plain', key);
    event.dataTransfer.effectAllowed = 'move';
  }

  // Tab state
  const [tabValue, setTabValue] = useState(0);
  const handleTabChange = (_: any, newValue: number) => {
    setTabValue(newValue);
  };

  const groupedNodes = useMemo(() => {
    // First get the base grouped nodes
    const grouped = tabValue === 0 ? groupBy('module', nodeRegistry) : groupBy('category', nodeRegistry);

    // If there's a search filter, only include nodes that match
    if (filteredNodes) {
      return Object.fromEntries(
        Object.entries(grouped).map(([module, nodes]: [string, any]) => [
          module,
          nodes.filter((node: any) => filteredNodes.includes(node.key))
        ]).filter(([_, nodes]) => nodes.length > 0)
      );
    }

    return grouped;
  }, [nodeRegistry, filteredNodes, tabValue]);

  return (
    <Box
      className="left-sidebar"
      textAlign="center"
      sx={{
        width: sidebarWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <OutlinedInput
          startAdornment={<SearchIcon fontSize="small" sx={{ marginRight: 1 }} />}
          id="main-module-search"
          placeholder="Search"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '100%', fontSize: '14px' }}
        />
      </Box>
      <Box sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            lineHeight: '16px',
            minHeight: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
            '.MuiButtonBase-root': { textTransform: 'none', lineHeight: '16px', minHeight: 0 }
          }}
        >
          <Tab label="Modules" />
          <Tab label="Categories" />
        </Tabs>
      </Box>
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        p: 0, m: 0,
      }}>
        <Box sx={{ p: 0, pb: 0, m: 0 }}>
          {Object.entries(groupedNodes).map(([module, nodes]: [string, any]) => (
            <Accordion disableGutters key={module} sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              backgroundColor: '#1a1a1a',
              fontSize: 12,
              p: 0, m: 0,
              '&:before': {
                backgroundColor: 'transparent',
              },
              '.MuiAccordionSummary-root': {
                backgroundColor: '#1a1a1a',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              },
              '.MuiAccordionDetails-root': {
                backgroundColor: '#1a1a1a',
                padding: '8px 4px',
              },
            }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>{module.replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</AccordionSummary>
              <AccordionDetails>
                <List dense={true} sx={{ p: 1.5, pt: 0, pb: 0, m: 0 }}>
                  {nodes.map((node: any) => (
                    <ListItem
                      key={node.key}
                      draggable
                      className={`${node.key} category-${node.category} module-${node.module}`}
                      onDragStart={(event) => onDragStart(event, node.key)}
                      sx={{
                        outline: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        boxShadow: 3,
                        m: 0, mb: 1,
                        p: 0.5, pl: 1,
                        borderLeftWidth: '8px',
                        borderLeftStyle: 'solid',
                        cursor: 'grab',
                        display: !filteredNodes || filteredNodes.includes(node.key) ? 'flex' : 'none',
                      }}
                    >
                      <ListItemText primary={node.label || node.key} sx={{ '& .MuiTypography-root': { fontSize: 12 } }} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
