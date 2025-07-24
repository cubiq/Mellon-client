import {
  Background,
  BackgroundVariant,
  Connection,
  Edge,
  FinalConnectionState,
  IsValidConnection,
  ReactFlow,
  useReactFlow,
  NodeChange,
  getIncomers,
  Viewport,
  useUpdateNodeInternals,
  ConnectionLineType,
} from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { useCallback, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { enqueueSnackbar } from 'notistack';

import NodeSearchDialog from './NodeSearchDialog';
import { NodeData, useNodesStore } from '../stores/useNodeStore';
import { useFlowStore, CustomNodeType } from '../stores/useFlowStore';
import { useSettingsStore } from '../stores/useSettingsStore';

import CustomNode from './CustomNode';
import AnyNode from './AnyNode';

import Box from '@mui/material/Box';
import FileBrowserDialog from './FileBrowserDialog';
import ModelManagerDialog from './ModelManagerDialog';
import AlertDialog from './AlertDialog';
import SettingsDialog from './SettingsDialog';

const nodeTypes = {
  custom: CustomNode,
  any: AnyNode
};

function Workflow() {
  const { nodesRegistry } = useNodesStore(
    useShallow(state => ({
      nodesRegistry: state.nodesRegistry
    }))
  );
  const { nodes, edges, defaultViewport } = useFlowStore(
    useShallow(state => ({
      nodes: state.nodes,
      edges: state.edges,
      defaultViewport: state.viewport
    }))
  );
  const addNode = useFlowStore(state => state.addNode);
  const onNodesChange = useFlowStore(state => state.onNodesChange);
  const onEdgesChange = useFlowStore(state => state.onEdgesChange);
  const onConnect = useFlowStore(state => state.onConnect);
  const getParam = useFlowStore(state => state.getParam);
  const removeEdges = useFlowStore(state => state.removeEdges);
  const setParam = useFlowStore(state => state.setParam);
  const updateViewportStore = useFlowStore(state => state.setViewport);
  const updateNodeInternals = useUpdateNodeInternals();

  const {
    edgeType,
    fileBrowserOpener,
    setFileBrowserOpener,
    modelManagerOpener,
    setModelManagerOpener,
    alertOpener,
    setAlertOpener,
    settingsOpener,
    setSettingsOpener,
  } = useSettingsStore();

  const { screenToFlowPosition, setNodes, setEdges, setViewport } = useReactFlow();

  const [anchorPosition, setAnchorPosition] = useState<{ top: number, left: number } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnectionValid, setIsConnectionValid] = useState<boolean | null>(null);
  const connectionTypeRef = useRef<string | string[] | null>(null);
  const dropHandleRef = useRef<{ nodeId: string, handleId: string, handleType: 'source' | 'target' | null, dataType: string | string[] | null } | null>(null);

  // State for ALT+drag functionality
  const [isAltDragging, setIsAltDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [connectedNodeIds, setConnectedNodeIds] = useState<Set<string>>(new Set());
  const [initialPositions, setInitialPositions] = useState<Map<string, { x: number, y: number }>>(new Map());
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number, y: number } | null>(null);

  // Helper function to find all upstream nodes connected to a given node
  const findConnectedNodes = useCallback((nodeId: string, visited: Set<string> = new Set()): Set<string> => {
    if (visited.has(nodeId)) {
      return visited;
    }
    
    visited.add(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      return visited;
    }
    
    // find upstream nodes
    const incomers = getIncomers(node, nodes, edges);
    
    // Recursively find upstream nodes
    for (const incomer of incomers) {
      if (!visited.has(incomer.id)) {
        findConnectedNodes(incomer.id, visited);
      }
    }
    
    return visited;
  }, [nodes, edges]);

  // Handle node drag start
  const handleNodeDragStart = useCallback((event: React.MouseEvent, node: CustomNodeType) => {
    const isAltPressed = event.altKey;
    
    if (isAltPressed) {
      setIsAltDragging(true);
      setDraggedNodeId(node.id);
      setDragStartPosition(node.position);
      
      // Find all connected nodes
      const connected = findConnectedNodes(node.id);
      setConnectedNodeIds(connected);
      
      // Store initial positions of all connected nodes
      const positions = new Map();
      connected.forEach(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          positions.set(nodeId, { x: node.position.x, y: node.position.y });
        }
      });
      setInitialPositions(positions);
    }
  }, [findConnectedNodes, nodes]);

  // Handle node drag
  const handleNodeDrag = useCallback((_event: React.MouseEvent, node: CustomNodeType) => {
    if (isAltDragging && draggedNodeId && connectedNodeIds.has(node.id) && dragStartPosition) {
      // Calculate the delta from the start position
      const deltaX = node.position.x - dragStartPosition.x;
      const deltaY = node.position.y - dragStartPosition.y;
      
      // Create node changes for all connected nodes
      const nodeChanges: NodeChange<CustomNodeType>[] = Array.from(connectedNodeIds)
        .filter(nodeId => nodeId !== node.id) // Skip the main dragged node as it's handled by React Flow
        .map(nodeId => {
          const node = nodes.find(n => n.id === nodeId);
          const initialPos = initialPositions.get(nodeId);
          if (node && initialPos) {
            return {
              type: 'position' as const,
              id: nodeId,
              position: {
                x: initialPos.x + deltaX,
                y: initialPos.y + deltaY
              },
              positionAbsolute: {
                x: initialPos.x + deltaX,
                y: initialPos.y + deltaY
              }
            } as NodeChange<CustomNodeType>;
          }
          return null;
        })
        .filter((change): change is NodeChange<CustomNodeType> => change !== null);
      
      // Apply the changes
      if (nodeChanges.length > 0) {
        onNodesChange(nodeChanges);
      }
    }
  }, [isAltDragging, draggedNodeId, connectedNodeIds, dragStartPosition, initialPositions, nodes, onNodesChange]);

  // Handle node drag stop
  const handleNodeDragStop = useCallback((_event: React.MouseEvent, _node: CustomNodeType) => {
    if (isAltDragging) {
      setIsAltDragging(false);
      setDraggedNodeId(null);
      setConnectedNodeIds(new Set());
      setInitialPositions(new Map());
      setDragStartPosition(null);
    }
  }, [isAltDragging]);

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('react-flow__pane')) {
      return;
    }

    event.preventDefault();
    setAnchorPosition({
      top: event.clientY,
      left: event.clientX
    });
  }, []);

  const handleNodeSearchSelect = useCallback((_: string, node: NodeData) => {
    if (!anchorPosition) {
      return;
    }

    const position = screenToFlowPosition({
      x: anchorPosition.left,
      y: anchorPosition.top
    });

    const newNode: CustomNodeType = {
      id: nanoid(),
      type: node.type,
      position,
      data: node
    }

    addNode(newNode);

    // Handle connection if dropHandleRef is defined
    if (dropHandleRef.current) {
      const { nodeId, handleId, handleType, dataType } = dropHandleRef.current;
      
      // Find matching handle in the new node
      const matchingHandle = Object.entries(node.params || {}).find(([_, param]) => {
        // Convert both types to arrays for consistent comparison
        const paramTypes = Array.isArray(param.type) ? param.type : [param.type];
        const dataTypes = Array.isArray(dataType) ? dataType : [dataType ?? 'any'];
        
        // Check if either type includes 'any'
        if (paramTypes.includes('any') || dataTypes.includes('any')) {
          return true;
        }
        
        // For source handles (outputs), check if any of the target's input types match the source type
        if (handleType === 'source') {
          return param.display === 'input' && paramTypes.some(type => dataTypes.includes(type ?? 'any'));
        }
        
        // For target handles (inputs), check if any of the source's output types match the target type
        return param.display === 'output' && dataTypes.some(type => paramTypes.includes(type ?? 'any'));
      });

      if (matchingHandle) {
        const [newHandleId] = matchingHandle;
        const connection = handleType === 'source' 
          ? { source: nodeId, sourceHandle: handleId, target: newNode.id, targetHandle: newHandleId, edgeType: edgeType }
          : { source: newNode.id, sourceHandle: newHandleId, target: nodeId, targetHandle: handleId, edgeType: edgeType };
        
        onConnect(connection);
      }

      dropHandleRef.current = null;
    }
  }, [anchorPosition, screenToFlowPosition, addNode, onConnect, edgeType]);
  
  const handleIsValidConnection = useCallback((conn: Connection) => {
    if (!conn.sourceHandle || !conn.targetHandle) {
      return false;
    }

    // prevent self loops
    if (conn.source === conn.target) {
      return false;
    }

    const sourceType = getParam(conn.source, conn.sourceHandle, 'type') || 'default';
    const targetType = getParam(conn.target, conn.targetHandle, 'type') || 'default';
    const sourceTypes = Array.isArray(sourceType) ? sourceType : [sourceType];
    const targetTypes = Array.isArray(targetType) ? targetType : [targetType];

    // check if the source type is compatible with the target type
    // if any of the target types is equal to 'any', the connection is valid
    if (targetTypes.includes('any') || sourceTypes.includes('any') || sourceTypes.some(type => targetTypes.includes(type))) {
      return true;
    }

    return false;
  }, [getParam]);

  const handleMouseMove = useCallback((event: MouseEvent | TouchEvent) => { 
    if (!connectionTypeRef.current) {
      setIsConnectionValid(null);
      return;
    }

    const target = (event.target as HTMLElement).closest('.mellon-field');
    if (!target) {
      setIsConnectionValid(null);
      return;
    }

    const fieldKey = target.getAttribute('data-key');
    if (!fieldKey) {
      setIsConnectionValid(null);
      return;
    }

    const nodeId = target.closest('.react-flow__node-custom')?.getAttribute('data-id');
    if (!nodeId) {
      setIsConnectionValid(null);
      return;
    }

    const targetType = getParam(nodeId, fieldKey, 'type');

    const sourceTypes = Array.isArray(connectionTypeRef.current) ? [...connectionTypeRef.current, 'any'] : [connectionTypeRef.current, 'any'];
    const targetTypes = Array.isArray(targetType) ? targetType : [targetType];
    const isConnectionValid = sourceTypes.some(type => targetTypes.includes(type));

    setIsConnectionValid(isConnectionValid);
  }, [getParam, connectionTypeRef]);

  const handleConnectStart = useCallback((event: MouseEvent | TouchEvent, params: { nodeId: string | null; handleId: string | null; handleType: "source" | "target" | null }) => {
    event.preventDefault();

    setIsConnecting(true);

    if (!params.nodeId || !params.handleId) {
      return;
    }

    const sourceType = getParam(params.nodeId, params.handleId, 'type') || 'default';
    connectionTypeRef.current = sourceType;
    dropHandleRef.current = null;

    document.addEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Helper function to handle dropping connection on workflow pane
  const handleDropOnPane = useCallback((event: MouseEvent | TouchEvent, conn: FinalConnectionState) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('react-flow__pane')) {
      const handleId = conn.fromHandle?.id;
      if (handleId) {
        const fromNodeData = conn.fromNode?.data as NodeData;
        const param = fromNodeData.params?.[handleId as keyof typeof fromNodeData.params];
        if (param) {
          dropHandleRef.current = {
            nodeId: conn.fromNode?.id ?? '',
            handleId: handleId,
            handleType: conn.fromHandle?.type === 'source' ? 'source' : 'target',
            dataType: param.type ?? null
          };
        }
      }
      setAnchorPosition({
        top: 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY,
        left: 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX
      });
      return true;
    }
    return false;
  }, [setAnchorPosition]);

  // Helper function to handle dropping connection on a field
  const handleDropOnField = useCallback((event: MouseEvent | TouchEvent, conn: FinalConnectionState) => {
    if (!conn.fromNode?.id || !conn.fromHandle?.id) {
      return false;
    }

    const target = (event.target as HTMLElement).closest('.mellon-field');
    if (!target) {
      return false;
    }

    const fieldKey = target.getAttribute('data-key');
    if (!fieldKey) {
      return false;
    }
    
    const nodeId = target.closest('.react-flow__node-custom')?.getAttribute('data-id');
    if (!nodeId) {
      return false;
    }

    const targetIsInput = getParam(nodeId, fieldKey, 'isInput');
    if (targetIsInput) {
      return false;
    }

    // check if the source and target handle types match
    const sourceType = getParam(conn.fromNode.id, conn.fromHandle.id, 'type');
    const targetType = getParam(nodeId, fieldKey, 'type');
    const sourceTypes = Array.isArray(sourceType) ? [...sourceType, 'any'] : [sourceType, 'any'];
    const targetTypes = Array.isArray(targetType) ? targetType : [targetType];
    if (!sourceTypes.some(type => targetTypes.includes(type))) {
      return false;
    }

    setParam(nodeId, fieldKey, true, 'isInput');
    updateNodeInternals(nodeId);
    // the isInput property will convert the field to an input
    // and a connection to it will be created automatically
    onConnect({
      source: conn.fromNode.id,
      sourceHandle: conn.fromHandle.id,
      target: nodeId,
      targetHandle: fieldKey,
      edgeType: edgeType
    });
    return true;
  }, [onConnect, edgeType, getParam, setParam, updateNodeInternals]);

  const handleConnectEnd = useCallback((event: MouseEvent | TouchEvent, conn: FinalConnectionState) => {
    event.preventDefault();
    setIsConnecting(false);
    connectionTypeRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);

    // if the connection is valid, don't check special cases
    if (conn.isValid) {
      return;
    }

    // if we dropped the connection on the workflow pane, open the node search dialog applying the input type as filter
    if (!conn.isValid && conn.toHandle === null) {
      if (handleDropOnPane(event, conn)) {
        return;
      }
    }

    // Handle dropping on a field
    handleDropOnField(event, conn);
  }, [setIsConnecting, handleDropOnPane, handleDropOnField, handleMouseMove]);

  const handleConnect = useCallback((conn: Connection) => {
    const newConn = {
      ...conn,
      edgeType,
    }
    onConnect(newConn);
  }, [onConnect, edgeType]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    // if dropping a json file, import the graph
    if (event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type !== 'application/json') {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const graph = JSON.parse(e.target?.result as string);
        const { nodes, edges, viewport } = graph;

        // override the edge type to the value of the edgeType store
        const newEdges = edges.map((e: Edge) => ({
          ...e,
          type: edgeType
        }));

        setNodes(nodes);
        setEdges(newEdges);
        setViewport(viewport);
      }
      reader.readAsText(file);
      return;
    }

    // if dropping a node, add it to the graph
    const data = event.dataTransfer.getData('text/plain');

    if (!data) {
      const err = `No node data found. Reload the page to refresh the node list.`;
      enqueueSnackbar(err, { variant: 'error', autoHideDuration: err.length * 80 });
      return;
    }

    const node = nodesRegistry[data];
    if (!node) {
      const err = `Node ${data} not found. Reload the page to refresh the node list.`;
      enqueueSnackbar(err, { variant: 'error', autoHideDuration: err.length * 80 });
      return;
    }

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    });

    const newNode: CustomNodeType = {
      id: nanoid(),
      type: node.type,
      position,
      data: node
    }

    addNode(newNode);
  }, [screenToFlowPosition, addNode, nodesRegistry, edgeType]);

  const handleEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    removeEdges(edge.id);
    updateNodeInternals(edge.target);
  }, [removeEdges, updateNodeInternals]);

  const handleViewportChange = useCallback((viewport: Viewport) => {
    updateViewportStore(viewport);
  }, [updateViewportStore]);

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        defaultViewport={defaultViewport}
        connectionLineType={edgeType as ConnectionLineType}
        nodeOrigin={[0, 0]}
        minZoom={0.2}
        maxZoom={1.5}
        colorMode={'dark'}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
        zoomOnDoubleClick={false}
        isValidConnection={handleIsValidConnection as IsValidConnection}
        onDoubleClick={handleDoubleClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        onConnect={handleConnect}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onViewportChange={handleViewportChange}
        className={`${isConnecting ? 'connecting' : ''} ${isConnectionValid !== null ? isConnectionValid ? 'valid-connection' : 'invalid-connection' : ''}`}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="rgba(255, 255, 255, 0.4)"
        />
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            <marker id="connection-marker" viewBox="0 0 4 4" markerWidth="4" markerHeight="4" orient="auto-start-reverse" refX="2" refY="2">
              <rect x="0" y="0" width="4" height="4" rx="1" fill="#aaaaaa" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
      <NodeSearchDialog
        anchorPosition={anchorPosition}
        onClose={() => {
          setAnchorPosition(null);
          dropHandleRef.current = null;
        }}
        onSelect={handleNodeSearchSelect}
        nodes={nodesRegistry}
        inputType={dropHandleRef.current?.dataType ?? undefined}
      />
      <FileBrowserDialog
        opener={fileBrowserOpener}
        onClose={() => { setFileBrowserOpener(null); }}
      />
      <ModelManagerDialog
        opener={modelManagerOpener}
        onClose={() => { setModelManagerOpener(null); }}
      />
      <SettingsDialog
        opener={settingsOpener}
        onClose={() => { setSettingsOpener(null); }}
      />
      <AlertDialog
        opener={alertOpener}
        onClose={() => { setAlertOpener(null); }}
      />
    </Box>
  )
}

export default Workflow;