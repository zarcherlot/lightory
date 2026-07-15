import type { BlueprintEdge, BlueprintNode, BlueprintRevision, InkStroke } from './types.js';

interface CommandMetadata {
  revision: BlueprintRevision;
}

export interface StrokeReplacement {
  sourceStrokeId: string;
  strokes: InkStroke[];
}

export type BlueprintCommand =
  | (CommandMetadata & { type: 'stroke.add'; stroke: InkStroke })
  | (CommandMetadata & { type: 'stroke.delete'; strokeId: string })
  | (CommandMetadata & { type: 'stroke.replace'; replacements: StrokeReplacement[] })
  | (CommandMetadata & { type: 'document.clear' })
  | (CommandMetadata & { type: 'node.create'; node: BlueprintNode })
  | (CommandMetadata & {
      type: 'node.update';
      nodeId: string;
      label: string;
      kind: BlueprintNode['kind'];
    })
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

export type BlueprintCommandInput = {
  [Type in BlueprintCommand['type']]: Omit<Extract<BlueprintCommand, { type: Type }>, 'revision'>;
}[BlueprintCommand['type']];
