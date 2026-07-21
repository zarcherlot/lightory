export interface RoleTaskConsoleEntry {
  id: number;
  runId: string;
  roleId: string;
  status: 'started' | 'running' | 'done' | 'error';
  stream: 'system' | 'stdout' | 'stderr';
  content: string;
}
