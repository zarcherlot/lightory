import { createContext, useContext } from 'react';

export interface BlueprintNodeActions {
  onResize: (nodeId: string, size: { width: number; height: number }) => void;
}

export const BlueprintNodeActionsContext = createContext<BlueprintNodeActions>({
  onResize: () => undefined,
});

export function useBlueprintNodeActions(): BlueprintNodeActions {
  return useContext(BlueprintNodeActionsContext);
}
