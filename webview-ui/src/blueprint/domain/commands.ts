import type { BlueprintEdge, BlueprintNode, BlueprintRevision } from './types.js';

interface CommandMetadata {
  revision: BlueprintRevision;
}

export type BlueprintCommand =
  | (CommandMetadata & { type: 'node.create'; node: BlueprintNode })
  | (CommandMetadata & { type: 'node.rename'; nodeId: string; label: string })
  | (CommandMetadata & {
      type: 'node.move';
      nodeId: string;
      position: BlueprintNode['position'];
    })
  | (CommandMetadata & { type: 'node.set-parent'; nodeId: string; parentId?: string })
  | (CommandMetadata & { type: 'node.delete'; nodeId: string })
  | (CommandMetadata & { type: 'edge.create'; edge: BlueprintEdge })
  | (CommandMetadata & { type: 'edge.delete'; edgeId: string });
