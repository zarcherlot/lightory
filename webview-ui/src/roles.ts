export interface RoleDefinition {
  id: string;
  name: string;
  title: string;
  palette: number;
  taskFile: string;
}

export const ROLE_AGENT_ID_BASE = 9000;

export const roleDefinitions: RoleDefinition[] = [
  {
    id: 'planner',
    name: 'Planner',
    title: 'Plan',
    palette: 0,
    taskFile: 'roles/planner.md',
  },
  {
    id: 'researcher',
    name: 'Researcher',
    title: 'Research',
    palette: 1,
    taskFile: 'roles/researcher.md',
  },
  {
    id: 'architect',
    name: 'Architect',
    title: 'Design',
    palette: 2,
    taskFile: 'roles/architect.md',
  },
  {
    id: 'builder',
    name: 'Builder',
    title: 'Build',
    palette: 3,
    taskFile: 'roles/builder.md',
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    title: 'Review',
    palette: 4,
    taskFile: 'roles/reviewer.md',
  },
  {
    id: 'tester',
    name: 'Tester',
    title: 'Test',
    palette: 5,
    taskFile: 'roles/tester.md',
  },
];

export function getRoleAgentId(roleId: string): number {
  const index = roleDefinitions.findIndex((role) => role.id === roleId);
  return ROLE_AGENT_ID_BASE + Math.max(0, index);
}

export function getRoleDefinition(roleId: string): RoleDefinition | undefined {
  return roleDefinitions.find((role) => role.id === roleId);
}
