import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { NodeData } from '../stores/useNodeStore';

import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import SearchIcon from '@mui/icons-material/Search';

interface NodeSearchDialogProps {
  anchorPosition: { top: number, left: number } | null;
  onClose: () => void;
  onSelect: (nodeKey: string, node: NodeData) => void;
  nodes: Record<string, NodeData>;
  inputType?: string | string[];
}

const NodeSearchDialog = ({ anchorPosition, onClose, onSelect, nodes, inputType }: NodeSearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add effect to focus input when dialog opens
  useEffect(() => {
    if (anchorPosition && inputRef.current) {
      // Small delay to ensure the dialog is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [anchorPosition]);

  // Memoize the input type filtering
  const inputTypeFilteredNodes = useMemo(() => {
    if (!inputType) {
      return Object.entries(nodes);
    }

    return Object.entries(nodes).filter(([_, node]) => {
      // Check if any param has display "input" and matches the inputType
      return Object.values(node.params).some(param => {
        // Check if param has display "input"
        if (param.display !== 'input') {
          return false;
        }

        // Get the param type (could be string or array of strings)
        const paramType = param.type || 'default';
        const paramTypes = Array.isArray(paramType) ? paramType : [paramType];

        // Check if any of the param types match inputType or is "any"
        return paramTypes.some(type => type === inputType || type === 'any');
      });
    });
  }, [nodes, inputType]);

  // Apply search query filter directly to the memoized results
  const filteredNodes = inputTypeFilteredNodes.filter(([_, node]) =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (node.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = useCallback(() => {
      onClose();
      setTimeout(() => {
        setSearchQuery('');
        setSelectedIndex(0);
      }, 0);
  }, [onClose]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredNodes.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredNodes.length) % filteredNodes.length);
        break;
      case 'Enter':
        if (filteredNodes[selectedIndex]) {
          const [key, node] = filteredNodes[selectedIndex];
          onSelect(key, node);
        }
        handleClose();
        break;
      case 'Escape':
        handleClose();
        break;
    }
  }, [filteredNodes, selectedIndex, onSelect, handleClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Popover
      open={Boolean(anchorPosition)}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
      transitionDuration={0}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: 368,
            maxHeight: 512,
            backgroundColor: 'secondary.dark',
            backgroundImage: 'none',
            borderRadius: 0,
            outline: '4px solid',
            outlineColor: 'background.default',
          }                        
        }
      }}
    >
      {/* Search Input */}
      <Box sx={{ p: 1 }}>
        <OutlinedInput
          inputRef={inputRef}
          autoFocus
          fullWidth
          startAdornment={<SearchIcon fontSize="small" sx={{ mr: 0.5 }} />}
          placeholder="Search nodes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
        />
      </Box>

      {/* Results List */}
      <List sx={{ overflow: 'auto' }}>
        {filteredNodes.length === 0 ? (
          <ListItemText
            primary="No results found"
            secondary="Try a different search query"
            sx={{ textAlign: 'center' }}
          />
        ) : (
          filteredNodes.map(([key, node], index) => (
            <ListItemButton
              key={key}
              selected={index === selectedIndex}
              onClick={() => { onSelect(key, node); handleClose(); }}
              sx={{
                py: 0,
                '&.Mui-selected': {
                  backgroundColor: 'secondary.main',
                  '&:hover': {
                    backgroundColor: 'secondary.main',
                  }
                }
              }}
            >
              <ListItemText
                primary={node.label}
                secondary={node.description}
              />
            </ListItemButton>
          ))
        )}
      </List>
    </Popover>
  )
}

export default NodeSearchDialog;

