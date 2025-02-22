import { useEffect } from 'react';
import { 
  ReactFlow,
  //Controls,
  Background,
  BackgroundVariant,
  NodeOrigin,
  useReactFlow,
  Connection,
  IsValidConnection,
  Viewport
} from '@xyflow/react';
import { shallow } from 'zustand/shallow';
import { useNodeState, NodeState, CustomNodeType } from './stores/nodeStore';
import { useNodeRegistryState, NodeRegistryState } from './stores/nodeRegistryStore';
import { useWebsocketState, WebsocketState } from './stores/websocketStore';

import { nanoid } from 'nanoid';

import config from '../config';
import CustomNode from './components/CustomNode';

import '@xyflow/react/dist/base.css';
import './app.css';

const nodeTypes = {
  custom: CustomNode,
};

const selectNodeState = (state: NodeState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onEdgeDoubleClick: state.onEdgeDoubleClick,
  onConnect: state.onConnect,
  addNode: state.addNode,
  getParam: state.getParam,
});

const selectNodeRegistryState = (state: NodeRegistryState) => ({
  nodeRegistry: state.nodeRegistry,
  updateNodeRegistry: state.updateNodeRegistry,
});

const selectWebsocketState = (state: WebsocketState) => ({
  connect: state.connect,
});

const nodeOrigin: NodeOrigin = [0, 0];

export default function App() {
  const { nodes, edges, onNodesChange, onEdgesChange, onEdgeDoubleClick, onConnect, addNode, getParam } = useNodeState(selectNodeState, shallow);
  const { nodeRegistry, updateNodeRegistry } = useNodeRegistryState(selectNodeRegistryState, shallow);
  const { connect: connectWebsocket } = useWebsocketState(selectWebsocketState, shallow);
  const { screenToFlowPosition, setNodes, setEdges, setViewport } = useReactFlow();

  // Load the list of available nodes
  useEffect(() => {
    const stored = localStorage.getItem('workflow');
    if (stored) {
      const { nodes: storedNodes, edges: storedEdges } = JSON.parse(stored);

      setNodes(storedNodes || []);
      setEdges(storedEdges || []);
    }

    updateNodeRegistry();
    connectWebsocket('ws://' + config.serverAddress + '/ws');
  }, []);

  // Save viewport position when it changes
  const onMoveEnd = (_: MouseEvent | TouchEvent | null, viewport: Viewport) => {
    const workflow = JSON.parse(localStorage.getItem('workflow') || '{}');
    workflow.viewport = viewport;
    localStorage.setItem('workflow', JSON.stringify(workflow));
  };
  
  // TODO: probably need to use useCallback
  const onWorkflowDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file?.type !== 'application/json') return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const flow = JSON.parse(e.target?.result as string);
      const { x = 0, y = 0, zoom = 1 } = flow.viewport;
      setViewport({ x, y, zoom });
      setNodes(flow.nodes);
      setEdges(flow.edges);
    };

    reader.readAsText(file);
  };

  // Handle drag and drop
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.dataTransfer.types.includes('Files')) {
      event.dataTransfer.dropEffect = 'copy';
      return;
    }
    event.dataTransfer.dropEffect = 'move';
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    // Handle workflow file drops
    if (event.dataTransfer.files.length > 0) {
      onWorkflowDrop(event);
      return;
    }

    if (!nodeRegistry) return;

    const key = event.dataTransfer.getData('text/plain');
    if (!key || !nodeRegistry[key]) return;

    const nodeData = nodeRegistry[key];

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode = {
      id: nanoid(),
      type: 'custom', // for now we only have custom type
      position,
      data: nodeData,
    };

    addNode(newNode as CustomNodeType);
  }

  const isValidConnection = (connection: Connection) => {
    if (!connection.sourceHandle || !connection.targetHandle) return false;

    // prevent self-loops
    if (connection.source === connection.target) return false;

    let sourceType = getParam(connection.source, connection.sourceHandle, 'type');
    let targetType = getParam(connection.target, connection.targetHandle, 'type');
    sourceType = Array.isArray(sourceType) ? sourceType : [sourceType];
    sourceType.push('any');
    targetType = Array.isArray(targetType) ? targetType : [targetType];

    if (!sourceType.some((type: string) => targetType.includes(type))) return false;

    return true;
  }

  // Get stored viewport or use defaults
  const defaultViewport = (() => {
    const stored = localStorage.getItem('workflow');
    if (stored) {
      const { viewport } = JSON.parse(stored);
      if (viewport) {
        return viewport;
      }
    }
    return { x: 0, y: 0, zoom: 1 };
  })();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onEdgeDoubleClick={(_, edge) => onEdgeDoubleClick(edge.id)}
      isValidConnection={isValidConnection as IsValidConnection}
      onConnect={onConnect}
      nodeOrigin={nodeOrigin}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMoveEnd={onMoveEnd}
      edgesReconnectable={true}
      defaultViewport={defaultViewport}
      minZoom={0.1}
      maxZoom={1.2}
      //connectionRadius={18}
      //fitView
      proOptions={{hideAttribution: true}}
      deleteKeyCode={['Backspace', 'Delete']}      
    >
      {/* <Controls position="bottom-right" /> */}
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="rgba(255, 255, 255, 0.3)" />
    </ReactFlow>
  );
}
