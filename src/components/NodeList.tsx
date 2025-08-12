import { useMemo, useState } from "react";
import { NodeData } from "../stores/useNodeStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useNodesStore } from "../stores/useNodeStore";

import Box from "@mui/material/Box";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import OutlinedInput from "@mui/material/OutlinedInput";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import TextIcon from '@mui/icons-material/TextFields';
import CategoryIcon from '@mui/icons-material/Category';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FlipSharpIcon from '@mui/icons-material/FlipSharp';
import PhotoSizeSelectLargeSharpIcon from '@mui/icons-material/PhotoSizeSelectLargeSharp';
import ListItemIcon from "@mui/material/ListItemIcon";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PhotoFilterIcon from '@mui/icons-material/PhotoFilter';

function NodeList() {
  const { nodesRegistry } = useNodesStore();
  const [search, setSearch] = useState('');
  const { nodeGroupBy, setNodeGroupBy } = useSettingsStore();

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <Box sx={{ p: 1 }}>
        <OutlinedInput
          placeholder="Search"
          fullWidth
          size="small"
          startAdornment={<SearchIcon fontSize="small" sx={{ mr: 0.5 }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>
      <Box>
        <Tabs
          value={nodeGroupBy}
          onChange={(_, value) => setNodeGroupBy(value as 'module' | 'category')}
          variant="fullWidth"
          sx={{
            minHeight: 0,
            mb: '2px',
            '& .MuiButtonBase-root': {
              minHeight: 0,
            },
          }}
        >
          <Tab label="Modules" value="module" />
          <Tab label="Categories" value="category" />
        </Tabs>
      </Box>

      <Box sx={{ userSelect: 'none' }}>
        <NodeGroupList nodes={nodesRegistry} groupBy={nodeGroupBy} search={search} />
      </Box>
    </Box>
  )
}

function getIcon(category: string) {
  if (!category) category = 'default';
  switch (category.toLowerCase()) {
    case 'image':
      return <ImageIcon sx={{ fontSize: 18 }} />;
    case 'text':
        return <TextIcon sx={{ fontSize: 18 }} />;
    case 'primitive':
        return <CategoryIcon sx={{ fontSize: 18 }} />;
    case 'custom':
        return <PersonIcon sx={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.4)', verticalAlign: 'middle' }} />;
    case 'loader':
        return <LocalShippingIcon sx={{ fontSize: 18 }} />;
    case 'sampler':
        return <DirectionsRunIcon sx={{ fontSize: 18 }} />;
    case 'embedding':
        return <FlipSharpIcon sx={{ fontSize: 18 }} />;
    case 'upscaler':
        return <PhotoSizeSelectLargeSharpIcon sx={{ fontSize: 18 }} />;
    case 'image_filter':
        return <PhotoFilterIcon sx={{ fontSize: 18 }} />;
    default:
        return <WebAssetIcon sx={{ fontSize: 18 }} />;
  }
}

function NodeGroupList({ nodes, groupBy, search }: {
  nodes: Record<string, NodeData>;
  groupBy: 'module' | 'category';
  search: string;
}) {
  const {activeNodeGroups, setActiveNodeGroups} = useSettingsStore();

  const groups = useMemo(() => {
    return Object.values(nodes).filter(node =>
      node.label.toLowerCase().includes(search.toLowerCase()))
        .reduce((acc, node: NodeData) => {
          const group = node[groupBy];
          if (!acc[group]) {
            acc[group] = [];
          }
          acc[group].push(node);
          return acc;
        }, {} as Record<string, NodeData[]>);
      }, [nodes, groupBy, search]);

  return (
    <>
      {Object.entries(groups)
      .sort(([a], [b]) => a.substring(a.indexOf('.')+1).localeCompare(b.substring(b.indexOf('.')+1)))
      .map(([group, nodes]) => (
        <Accordion
          key={group}
          expanded={activeNodeGroups.includes(group)}
          onChange={() => setActiveNodeGroups(group)}
          disableGutters
          sx={{
            mb: '2px',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 1, py: 0, minHeight: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {groupBy==='category' && <Box sx={{ lineHeight: 1 }}>{getIcon(nodes[0].category)}</Box>}
              {groupBy==='module' && group.startsWith('custom.') && <Box>{getIcon('custom')}</Box>}
              <Typography variant="body2" sx={{ textTransform: 'capitalize', lineHeight: 1 }}>{group.substring(group.indexOf('.')+1).replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense sx={{ p: 0 }}>
              {[...nodes]
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((node) => (
                <ListItem
                  key={`${node.module}.${node.action}`}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', `${node.module}.${node.action}`);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  draggable
                  dense
                  disableGutters
                  className={`category-${node.category}`}
                  sx={{
                    cursor: 'grab',
                    mt: '2px',
                    borderLeftWidth: 4,
                    borderLeftStyle: 'solid',
                    borderLeftColor: 'transparent',
                    pl: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    },
                  }}
                >
                  {groupBy!=='category' ? <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>{getIcon(node.category)}</ListItemIcon> : null}
                  <ListItemText primary={node.label} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  )
}

export default NodeList;