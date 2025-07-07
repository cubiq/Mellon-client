import { NodeProps, NodeResizeControl } from "@xyflow/react";
import { memo, useCallback } from "react";
import { CustomNodeType, useFlowStore } from "../stores/useFlowStore";
import { NodeParams } from "../stores/useNodeStore";

import { deepEqual } from '../utils/deepEqual';
import NodeContent from "./NodeContent";

import Box from "@mui/material/Box";

const AnyNode = memo((node: NodeProps<CustomNodeType>) => {
  const style = node.data.style || {};
  const setParam = useFlowStore((state) => state.setParam);

  const handleOnChange = useCallback((param: string, value: any, key?: keyof NodeParams) => {
    setParam(node.id, param, value, key);
  }, [setParam, node.id]);

  return (
    <Box
      id={node.id}
      className={`${node.data.module}-${node.data.action} category-${node.data.category} module-${node.data.module}`}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: "100%",
        outlineOffset: "5px",
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: "transparent",
        borderRadius: "0",
        backgroundColor: "transparent",
        boxShadow: "none",
        ...style,
      }}
    >
      <NodeContent nodeId={node.id} params={node.data.params} updateStore={handleOnChange} module={node.data.module || ''} groupHandles={true} />
      { node.data.resizable && (
        <NodeResizeControl style={{ background: "transparent", border: "none" }}>
          <Box sx={{
            cursor: 'se-resize',
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '16px',
            height: '16px',
            }}
          />
        </NodeResizeControl>
      )}
    </Box>
  );
}, (prev, next) => {
  const prevParams = prev.data.params;
  const nextParams = next.data.params;
  const prevKeys = Object.keys(prevParams);
  const nextKeys = Object.keys(nextParams);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  if (!prevKeys.every(key => key in nextParams)) {
    return false;
  }

  for (const key of prevKeys) {
    const prevParam = prevParams[key];
    const nextParam = nextParams[key];

    if (!deepEqual(prevParam.value, nextParam.value)) {
      return false;
    }
    if (prevParam.disabled !== nextParam.disabled) {
      return false;
    }
    if (prevParam.hidden !== nextParam.hidden) {
      return false;
    }
    if (prevParam.isInput !== nextParam.isInput) {
      return false;
    }
  }

  return true;
});

export default AnyNode;

