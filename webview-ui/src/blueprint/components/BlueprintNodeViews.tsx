import { Handle, type NodeProps, Position } from '@xyflow/react';

import type { BlueprintFlowNode } from '../canvas/flowProjection.js';

export function FunctionNodeView(props: NodeProps<BlueprintFlowNode>) {
  return <NodeShell {...props} badge="功能" />;
}

export function ArtifactNodeView(props: NodeProps<BlueprintFlowNode>) {
  return <NodeShell {...props} badge="成果" />;
}

export function ContainerNodeView(props: NodeProps<BlueprintFlowNode>) {
  return <NodeShell {...props} badge="子系统" />;
}

function NodeShell({ data, selected, badge }: NodeProps<BlueprintFlowNode> & { badge: string }) {
  return (
    <div
      className={`engineering-node engineering-node-${data.kind} ${selected ? 'is-selected' : ''}`}
    >
      {data.kind !== 'container' && <Handle type="target" position={Position.Left} />}
      <span className="engineering-node-badge">{badge}</span>
      <strong>{data.label}</strong>
      <small>{data.kind === 'container' ? '包含并组织模块 · 双击编辑' : '双击编辑模块'}</small>
      {data.kind !== 'container' && <Handle type="source" position={Position.Right} />}
    </div>
  );
}
