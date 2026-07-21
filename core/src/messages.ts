/**
 * AUTO-GENERATED FROM core/asyncapi.yaml. DO NOT EDIT MANUALLY.
 *
 * Run `npm run asyncapi:generate` to regenerate.
 *
 * Source of truth: the yaml at core/asyncapi.yaml.
 * Editors and clients in any language can consume the spec directly.
 */

export type ServerMessage =
  | ProviderCapabilities
  | AgentCreated
  | AgentClosed
  | ExistingAgents
  | AgentStatus
  | AgentToolStart
  | AgentToolDone
  | AgentToolsClear
  | AgentToolPermission
  | AgentToolPermissionClear
  | SubagentToolStart
  | SubagentToolDone
  | SubagentClear
  | SubagentToolPermission
  | AgentTeamInfo
  | AgentTokenUsage
  | LayoutLoaded
  | FurnitureAssetsLoaded
  | CharacterSpritesLoaded
  | PetSpritesLoaded
  | FloorTilesLoaded
  | WallTilesLoaded
  | SettingsLoaded
  | ExternalAssetDirectoriesUpdated
  | RoleTaskConsole
  | RoleTaskStatus
  | RobotIntentPlanResult
  | RaceConversationRouteResult
  | RaceTutorOutput
  | AgentDiagnostics;

export type ClientMessage =
  | WebviewReady
  | StartRoleTask
  | ConsoleUserInput
  | PlanRobotIntent
  | RaceConversationRouteInput
  | RaceTutorInput
  | FocusAgent
  | CloseAgent
  | SaveAgentSeats
  | SaveLayout
  | SetSoundEnabled
  | SetLastSeenVersion
  | SetAlwaysShowLabels
  | SetHooksEnabled
  | SetHooksInfoShown
  | SetWatchAllSessions
  | ExportLayout
  | ImportLayout
  | OpenSessionsFolder
  | AddExternalAssetDirectory
  | RemoveExternalAssetDirectory
  | RequestDiagnostics;

export interface ProviderCapabilities {
  type: 'providerCapabilities';
  readingTools: string[];
  subagentToolNames: string[];
}

export interface AgentCreated {
  type: 'agentCreated';
  id: number;
  folderName?: string;
  isExternal?: boolean;
}

export interface AgentClosed {
  type: 'agentClosed';
  id: number;
}

export interface ExistingAgents {
  type: 'existingAgents';
  agents: number[];
  agentMeta: Record<string, AgentSeatMeta>;
  folderNames: Record<string, string>;
  externalAgents: Record<string, boolean>;
}

export interface AgentSeatMeta {
  palette?: number;
  hueShift?: number;
  seatId?: string;
}

export interface AgentStatus {
  type: 'agentStatus';
  id: number;
  status: AgentActivityStatus;
  awaitingInput?: boolean;
}

export type AgentActivityStatus = 'active' | 'waiting';

export interface AgentToolStart {
  type: 'agentToolStart';
  id: number;
  toolId: string;
  status: string;
  toolName?: string;
  permissionActive?: boolean;
  runInBackground?: boolean;
}

export interface AgentToolDone {
  type: 'agentToolDone';
  id: number;
  toolId: string;
}

export interface AgentToolsClear {
  type: 'agentToolsClear';
  id: number;
}

export interface AgentToolPermission {
  type: 'agentToolPermission';
  id: number;
}

export interface AgentToolPermissionClear {
  type: 'agentToolPermissionClear';
  id: number;
}

export interface SubagentToolStart {
  type: 'subagentToolStart';
  id: number;
  parentToolId: string;
  toolId: string;
  status: string;
}

export interface SubagentToolDone {
  type: 'subagentToolDone';
  id: number;
  parentToolId: string;
  toolId: string;
}

export interface SubagentClear {
  type: 'subagentClear';
  id: number;
  parentToolId: string;
}

export interface SubagentToolPermission {
  type: 'subagentToolPermission';
  id: number;
  parentToolId: string;
}

export interface AgentTeamInfo {
  type: 'agentTeamInfo';
  id: number;
  teamName?: string;
  agentName?: string;
  isTeamLead?: boolean;
  leadAgentId?: number;
  teamUsesTmux?: boolean;
}

export interface AgentTokenUsage {
  type: 'agentTokenUsage';
  id: number;
  inputTokens: number;
  outputTokens: number;
}

export interface LayoutLoaded {
  type: 'layoutLoaded';
  layout: Record<string, any> | null;
  wasReset?: boolean;
}

export interface FurnitureAssetsLoaded {
  type: 'furnitureAssetsLoaded';
  catalog: FurnitureAssetMessage[];
  sprites: Record<string, string[][]>;
}

export interface FurnitureAssetMessage {
  id: string;
  name: string;
  label: string;
  category: string;
  file: string;
  width: number;
  height: number;
  footprintW: number;
  footprintH: number;
  isDesk: boolean;
  canPlaceOnWalls: boolean;
  groupId?: string;
  canPlaceOnSurfaces?: boolean;
  backgroundTiles?: number;
  orientation?: string;
  state?: string;
  mirrorSide?: boolean;
  rotationScheme?: string;
  animationGroup?: string;
  frame?: number;
}

export interface CharacterSpritesLoaded {
  type: 'characterSpritesLoaded';
  characters: CharacterSpriteSet[];
}

export interface CharacterSpriteSet {
  down: string[][][];
  up: string[][][];
  right: string[][][];
}

export interface PetSpritesLoaded {
  type: 'petSpritesLoaded';
  pets: PetSpriteFrameSet[];
  petNames: string[];
}

export interface PetSpriteFrameSet {
  walkDown: string[][][];
  idleDown: string[][][];
  walkUp: string[][][];
  idleUp: string[][][];
  walkRight: string[][][];
}

export interface FloorTilesLoaded {
  type: 'floorTilesLoaded';
  sprites: string[][][];
}

export interface WallTilesLoaded {
  type: 'wallTilesLoaded';
  sets: string[][][][];
}

export interface SettingsLoaded {
  type: 'settingsLoaded';
  soundEnabled: boolean;
  lastSeenVersion: string;
  extensionVersion: string;
  watchAllSessions: boolean;
  alwaysShowLabels: boolean;
  hooksEnabled: boolean;
  hooksInfoShown: boolean;
  externalAssetDirectories: string[];
}

export interface ExternalAssetDirectoriesUpdated {
  type: 'externalAssetDirectoriesUpdated';
  dirs: string[];
}

export interface RoleTaskConsole {
  type: 'roleTaskConsole';
  runId: string;
  roleId: string;
  status: AnonymousSchema_164;
  stream: AnonymousSchema_165;
  content: string;
}

export type AnonymousSchema_164 = 'started' | 'running' | 'done' | 'error';

export type AnonymousSchema_165 = 'system' | 'stdout' | 'stderr';

export interface RoleTaskStatus {
  type: 'roleTaskStatus';
  runId: string;
  roleId: string;
  status: AnonymousSchema_170;
  weatherIcon?: AnonymousSchema_171;
}

export type AnonymousSchema_170 = 'started' | 'done' | 'error';

export type AnonymousSchema_171 = 'sun' | 'cloud' | 'rain' | 'snow' | 'storm';

export interface RobotIntentPlanResult {
  type: 'robotIntentPlanResult';
  requestId: string;
  ok: boolean;
  intent?: Record<string, any>;
  error?: string;
}

export interface RaceConversationRouteResult {
  type: 'raceConversationRouteResult';
  requestId: string;
  ok: boolean;
  speakerRole?: AnonymousSchema_180;
  route?: AnonymousSchema_181;
  confidence?: number;
  reason?: string;
  error?: string;
}

export type AnonymousSchema_180 = 'child' | 'developer' | 'operator' | 'unknown';

export type AnonymousSchema_181 =
  | 'ai_tutor'
  | 'robot_execution'
  | 'robot_tool_planning'
  | 'general_robot_intent';

export interface RaceTutorOutput {
  type: 'raceTutorOutput';
  requestId: string;
  sessionId: string;
  ok: boolean;
  publicReply?: string;
  expertReplies?: AnonymousSchema_191[];
  suggestedRobotAction?: AnonymousSchema_194;
  raceDraftPatch?: Record<string, any>;
  error?: string;
  expertNotes?: AnonymousSchema_198[];
}

export interface AnonymousSchema_191 {
  expertId: string;
  publicReply: string;
}

export type AnonymousSchema_194 = 'none' | 'record_point' | 'run_lap';

export interface AnonymousSchema_198 {
  expertId: string;
  note: string;
}

export interface AgentDiagnostics {
  type: 'agentDiagnostics';
  agents: Record<string, any>[];
}

export interface WebviewReady {
  type: 'webviewReady';
}

export interface StartRoleTask {
  type: 'startRoleTask';
  roleId: string;
  col: number;
  row: number;
  inputCards?: RoleTaskInputCard[];
  taskOverride?: RoleTaskOverride;
}

export interface RoleTaskInputCard {
  sourceRoleId: string;
  card: string;
  content: string;
}

export interface RoleTaskOverride {
  markdown: string;
}

export interface ConsoleUserInput {
  type: 'consoleUserInput';
  content: string;
  roleId?: string;
}

export interface PlanRobotIntent {
  type: 'planRobotIntent';
  requestId: string;
  content: string;
  tools: Record<string, any>[];
}

export interface RaceConversationRouteInput {
  type: 'raceConversationRouteInput';
  requestId: string;
  content: string;
  raceSessionActive?: boolean;
  knownFacts?: Record<string, any>;
}

export interface RaceTutorInput {
  type: 'raceTutorInput';
  requestId: string;
  sessionId: string;
  content: string;
  knownFacts?: Record<string, any>;
}

export interface FocusAgent {
  type: 'focusAgent';
  id: number;
}

export interface CloseAgent {
  type: 'closeAgent';
  id: number;
}

export interface SaveAgentSeats {
  type: 'saveAgentSeats';
  seats: Record<string, SeatAssignment>;
}

export interface SeatAssignment {
  palette: number;
  hueShift: number;
  seatId: string | null;
}

export interface SaveLayout {
  type: 'saveLayout';
  layout: Record<string, any>;
}

export interface SetSoundEnabled {
  type: 'setSoundEnabled';
  enabled: boolean;
}

export interface SetLastSeenVersion {
  type: 'setLastSeenVersion';
  version: string;
}

export interface SetAlwaysShowLabels {
  type: 'setAlwaysShowLabels';
  enabled: boolean;
}

export interface SetHooksEnabled {
  type: 'setHooksEnabled';
  enabled: boolean;
}

export interface SetHooksInfoShown {
  type: 'setHooksInfoShown';
}

export interface SetWatchAllSessions {
  type: 'setWatchAllSessions';
  enabled: boolean;
}

export interface ExportLayout {
  type: 'exportLayout';
}

export interface ImportLayout {
  type: 'importLayout';
}

export interface OpenSessionsFolder {
  type: 'openSessionsFolder';
}

export interface AddExternalAssetDirectory {
  type: 'addExternalAssetDirectory';
}

export interface RemoveExternalAssetDirectory {
  type: 'removeExternalAssetDirectory';
  path: string;
}

export interface RequestDiagnostics {
  type: 'requestDiagnostics';
}
