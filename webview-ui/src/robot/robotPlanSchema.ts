import type {
  PlanValidationIssue,
  PlanValidationResult,
  RobotPlan,
  RobotRisk,
  RobotToolDefinition,
} from './types.js';

const riskRank: Record<RobotRisk, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function validateRobotPlanLocally(
  plan: RobotPlan,
  tools: RobotToolDefinition[],
): PlanValidationResult {
  const toolMap = new Map(tools.map((tool) => [tool.name, tool]));
  const errors: PlanValidationIssue[] = [];
  const warnings: PlanValidationIssue[] = [];

  if (plan.schemaVersion !== 'robot-plan/v1') {
    errors.push({ code: 'schema_version', message: 'Unsupported robot plan schema.' });
  }
  if (plan.steps.length > plan.constraints.maxSteps) {
    errors.push({ code: 'max_steps', message: 'Plan exceeds maxSteps.' });
  }
  if (plan.constraints.maxDurationMs <= 0) {
    errors.push({ code: 'max_duration', message: 'Plan maxDurationMs must be positive.' });
  }

  const stepIds = new Set<string>();
  for (const step of plan.steps) {
    if (stepIds.has(step.id)) {
      errors.push({
        code: 'duplicate_step',
        message: `Duplicate step ${step.id}.`,
        stepId: step.id,
      });
    }
    stepIds.add(step.id);

    const tool = toolMap.get(step.tool);
    if (!tool) {
      errors.push({
        code: 'missing_tool',
        message: `Robot tool ${step.tool} is unavailable.`,
        stepId: step.id,
      });
      continue;
    }
    if (!plan.constraints.allowedTools.includes(step.tool)) {
      errors.push({
        code: 'tool_not_allowed',
        message: `Tool ${step.tool} is not in allowedTools.`,
        stepId: step.id,
      });
    }
    if (plan.constraints.forbiddenTools?.includes(step.tool)) {
      errors.push({
        code: 'tool_forbidden',
        message: `Tool ${step.tool} is forbidden.`,
        stepId: step.id,
      });
    }
    if (!isAlwaysAllowedStopTool(step.tool) && riskRank[tool.risk] > riskRank[plan.risk]) {
      errors.push({
        code: 'risk_mismatch',
        message: `Tool ${step.tool} risk exceeds plan risk.`,
        stepId: step.id,
      });
    }
    if (
      !isAlwaysAllowedStopTool(step.tool) &&
      (tool.risk === 'high' || tool.risk === 'critical') &&
      !plan.requiresUserConfirmation
    ) {
      errors.push({
        code: 'confirmation_required',
        message: `Tool ${step.tool} requires user confirmation.`,
        stepId: step.id,
      });
    }
    if (tool.requiresLease && step.safety?.requiresLease !== tool.requiresLease) {
      errors.push({
        code: 'lease_required',
        message: `Tool ${step.tool} requires ${tool.requiresLease} lease.`,
        stepId: step.id,
      });
    }
  }

  for (const step of plan.steps) {
    for (const dependency of step.dependsOn ?? []) {
      if (!stepIds.has(dependency)) {
        errors.push({
          code: 'missing_dependency',
          message: `Missing dependency ${dependency}.`,
          stepId: step.id,
        });
      }
    }
  }

  if (hasCycle(plan)) {
    errors.push({ code: 'cycle', message: 'Plan dependencies contain a cycle.' });
  }

  if (!plan.steps.some((step) => step.tool === 'base.stop' || step.tool === 'watchdog.release')) {
    warnings.push({
      code: 'no_stop_fallback',
      message: 'Plan has no explicit stop or release fallback.',
    });
  }

  return {
    ok: errors.length === 0,
    planId: plan.planId,
    normalizedPlan: errors.length === 0 ? plan : undefined,
    errors,
    warnings,
  };
}

function isAlwaysAllowedStopTool(toolName: string): boolean {
  return toolName === 'base.stop' || toolName === 'arm.stop';
}

function hasCycle(plan: RobotPlan): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(plan.steps.map((step) => [step.id, step]));

  const visit = (stepId: string): boolean => {
    if (visiting.has(stepId)) return true;
    if (visited.has(stepId)) return false;
    visiting.add(stepId);
    for (const dependency of byId.get(stepId)?.dependsOn ?? []) {
      if (visit(dependency)) return true;
    }
    visiting.delete(stepId);
    visited.add(stepId);
    return false;
  };

  return plan.steps.some((step) => visit(step.id));
}
