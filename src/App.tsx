import { useEffect } from 'react';
import { 
  ReactFlow,
  //Controls,
  Background,
  BackgroundVariant,
  NodeOrigin,
  useReactFlow,
  Connection,
  IsValidConnection
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

const nodeOrigin: NodeOrigin = [0.5, 0.5];
const connectionLineStyle = { strokeWidth: 3, strokeDasharray: '8,8' };
const defaultEdgeOptions = { style: { ...connectionLineStyle, strokeDasharray: 'none' } };

export default function App() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, getParam } = useNodeState(selectNodeState, shallow);
  const { nodeRegistry, updateNodeRegistry } = useNodeRegistryState(selectNodeRegistryState, shallow);
  const { connect: connectWebsocket } = useWebsocketState(selectWebsocketState, shallow);
  const { screenToFlowPosition } = useReactFlow();

  // Load the list of available nodes
  useEffect(() => {
    updateNodeRegistry();
    connectWebsocket('ws://' + config.serverAddress + '/ws');
  }, []);

  // Handle drag and drop
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
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

    let sourceType = getParam(connection.source, connection.sourceHandle, 'type');
    let targetType = getParam(connection.target, connection.targetHandle, 'type');
    sourceType = Array.isArray(sourceType) ? sourceType : [sourceType];
    sourceType.push('any');
    targetType = Array.isArray(targetType) ? targetType : [targetType];

    if (!sourceType.some((type: string) => targetType.includes(type))) return false;

    return true;
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      isValidConnection={isValidConnection as IsValidConnection}
      onConnect={onConnect}
      nodeOrigin={nodeOrigin}
      onDragOver={onDragOver}
      onDrop={onDrop}
      edgesReconnectable={true}
      connectionLineStyle={connectionLineStyle}
      defaultEdgeOptions={defaultEdgeOptions}
      minZoom={0.1}
      maxZoom={1.2}
      //fitView
      proOptions={{hideAttribution: true}}
      deleteKeyCode={['Backspace', 'Delete']}      
    >
      {/* <Controls position="bottom-right" /> */}
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="rgba(255, 255, 255, 0.3)" />
    </ReactFlow>
  );
}
