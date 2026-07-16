import { Handle, type NodeProps, NodeResizer, Position } from '@xyflow/react';

import { BLUEPRINT_FUNCTION_NODE_COLOR } from '../../constants.js';
import type { BlueprintFlowNode } from '../canvas/flowProjection.js';
import { useBlueprintNodeActions } from './BlueprintNodeActions.js';

export function FunctionNodeView(props: NodeProps<BlueprintFlowNode>) {
  return <NodeShell {...props} badge="功能" />;
}

export function StartNodeView(props: NodeProps<BlueprintFlowNode>) {
  return <NodeShell {...props} badge="启动" />;
}

export function EndNodeView(props: NodeProps<BlueprintFlowNode>) {
  return <NodeShell {...props} badge="结束" />;
}

export function ArtifactNodeView(props: NodeProps<BlueprintFlowNode>) {
  return <NodeShell {...props} badge="旧信息" />;
}

export function ContainerNodeView(props: NodeProps<BlueprintFlowNode>) {
  return <NodeShell {...props} badge="子系统" />;
}

function NodeShell({ id, data, selected, badge }: NodeProps<BlueprintFlowNode> & { badge: string }) {
  const { onResize } = useBlueprintNodeActions();
  return (
    <div
      className={`engineering-node engineering-node-${data.kind} ${selected ? 'is-selected' : ''} ${data.assignmentStatus ? `has-assignment is-assignment-${data.assignmentStatus}` : ''}`}
    >
      <NodeResizer
        color={BLUEPRINT_FUNCTION_NODE_COLOR}
        isVisible={selected}
        keepAspectRatio={data.kind === 'artifact'}
        minHeight={72}
        minWidth={96}
        onResizeEnd={(_event, params) => onResize(id, { width: params.width, height: params.height })}
      />
      {data.kind !== 'start' && <Handle type="target" position={Position.Left} />}
      <span className="engineering-node-badge">{badge}</span>
      <strong>{data.label}</strong>
      <small>
        {data.kind === 'container'
          ? '双击进入子系统'
          : data.kind === 'start'
            ? '程序从这里开始 · 双击编辑'
            : data.kind === 'end'
              ? '任务在这里完成 · 双击编辑'
            : '双击编辑模块'}
      </small>
      {data.controlSummary && <span className="engineering-node-control-summary">{data.controlSummary}</span>}
      {data.assignmentStatus && (
        <span className="engineering-node-assignment-state">
          {data.assignmentStatus === 'awaiting-review'
            ? '等待总工程师验收'
            : data.assignmentStatus === 'working'
              ? '已派工 · 等待轮到他'
              : data.assignmentStatus === 'accepted'
                ? '已验收'
                : '已分配 Agent'}
        </span>
      )}
      {data.kind !== 'end' && <Handle type="source" position={Position.Right} />}
    </div>
  );
}
