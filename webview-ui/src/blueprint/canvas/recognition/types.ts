import type { InkStroke } from '../../domain/types.js';

export type RecognitionKind = 'rectangle' | 'ellipse' | 'arrow' | 'line' | 'text' | 'unknown';

export interface InkRecognitionRequest {
  requestId: string;
  strokes: InkStroke[];
  mode: 'shape' | 'text';
  language?: string;
}

export interface RecognitionCandidate {
  requestId: string;
  strokeIds: string[];
  kind: RecognitionKind;
  confidence: number;
  textCandidates?: string[];
  bounds?: { x: number; y: number; width: number; height: number };
  line?: { start: { x: number; y: number }; end: { x: number; y: number } };
}

export interface InkRecognizer {
  recognize(request: InkRecognitionRequest): Promise<RecognitionCandidate[]>;
}
