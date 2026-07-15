import { lazy, Suspense } from 'react';

const BlueprintWorkbenchPage = lazy(() =>
  import('./BlueprintWorkbenchPage.js').then((module) => ({
    default: module.BlueprintWorkbenchPage,
  })),
);

export function BlueprintWorkbenchRoute() {
  return (
    <Suspense fallback={null}>
      <BlueprintWorkbenchPage />
    </Suspense>
  );
}
