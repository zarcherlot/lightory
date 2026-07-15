import { isBlueprintDocument } from '../domain/document.js';
import type { BlueprintDocument } from '../domain/types.js';

export interface BlueprintRepository {
  save(projectId: string, document: BlueprintDocument): Promise<void>;
  load(projectId: string): Promise<BlueprintDocument | null>;
  remove(projectId: string): Promise<void>;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class BlueprintRepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'BlueprintRepositoryError';
  }
}

export class LocalStorageBlueprintRepository implements BlueprintRepository {
  private readonly storage: StorageLike;
  private readonly keyPrefix: string;

  constructor(
    storage: StorageLike,
    keyPrefix = 'lightory.blueprint.v1',
  ) {
    this.storage = storage;
    this.keyPrefix = keyPrefix;
  }

  async save(projectId: string, document: BlueprintDocument): Promise<void> {
    assertProjectId(projectId);
    if (!isBlueprintDocument(document)) {
      throw new BlueprintRepositoryError('Cannot save an invalid blueprint/v1 document.');
    }

    try {
      this.storage.setItem(this.key(projectId), JSON.stringify(document));
    } catch (error) {
      throw new BlueprintRepositoryError(`Failed to save blueprint project ${projectId}.`, {
        cause: error,
      });
    }
  }

  async load(projectId: string): Promise<BlueprintDocument | null> {
    assertProjectId(projectId);
    const serialized = this.storage.getItem(this.key(projectId));
    if (serialized === null) return null;

    try {
      const parsed = JSON.parse(serialized) as unknown;
      if (!isBlueprintDocument(parsed)) {
        throw new BlueprintRepositoryError(
          `Stored blueprint project ${projectId} is not a blueprint/v1 document.`,
        );
      }
      return parsed;
    } catch (error) {
      if (error instanceof BlueprintRepositoryError) throw error;
      throw new BlueprintRepositoryError(`Failed to load blueprint project ${projectId}.`, {
        cause: error,
      });
    }
  }

  async remove(projectId: string): Promise<void> {
    assertProjectId(projectId);
    this.storage.removeItem(this.key(projectId));
  }

  private key(projectId: string): string {
    return `${this.keyPrefix}:${projectId}`;
  }
}

function assertProjectId(projectId: string): void {
  if (!projectId.trim()) throw new BlueprintRepositoryError('Project id cannot be empty.');
}
