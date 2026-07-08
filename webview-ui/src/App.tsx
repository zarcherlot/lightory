import { useCallback, useEffect, useRef, useState } from 'react';

import { toMajorMinor } from './changelogData.js';
import { ChangelogModal } from './components/ChangelogModal.js';
import { DebugView } from './components/DebugView.js';
import { EditActionBar } from './components/EditActionBar.js';
import {
  type EducationConnection,
  EducationModeOverlay,
  type EducationRunStatus,
} from './components/EducationModeOverlay.js';
import { MigrationNotice } from './components/MigrationNotice.js';
import { RoleConfigModal } from './components/RoleConfigModal.js';
import { RoleDock } from './components/RoleDock.js';
import { RoleTaskConsole } from './components/RoleTaskConsole.js';
import { SettingsModal } from './components/SettingsModal.js';
import { Tooltip } from './components/Tooltip.js';
import { Modal } from './components/ui/Modal.js';
import { VersionIndicator } from './components/VersionIndicator.js';
import { ZoomControls } from './components/ZoomControls.js';
import { useEditorActions } from './hooks/useEditorActions.js';
import { useEditorKeyboard } from './hooks/useEditorKeyboard.js';
import { useExtensionMessages } from './hooks/useExtensionMessages.js';
import { OfficeCanvas } from './office/components/OfficeCanvas.js';
import { ToolOverlay } from './office/components/ToolOverlay.js';
import { EditorState } from './office/editor/editorState.js';
import { EditorToolbar } from './office/editor/EditorToolbar.js';
import { OfficeState } from './office/engine/officeState.js';
import { isRotatable } from './office/layout/furnitureCatalog.js';
import { getPetCount } from './office/sprites/petSpriteData.js';
import { EditTool } from './office/types.js';
import { createDefaultRoleConfig, type RoleRuntimeConfig } from './roleConfig.js';
import {
  getRoleAgentId,
  getRoleDefinition,
  newsSummaryRoleDefinitions,
  roleDefinitions,
} from './roles.js';
import { isE2E } from './runtime.js';
import { installTestHooks } from './testHooks.js';
import { transport } from './transport/index.js';

// Game state lives outside React — updated imperatively by message handlers
const officeStateRef = { current: null as OfficeState | null };
const editorState = new EditorState();
const MAX_ROLE_TASK_ATTEMPTS = 3;

const createInitialRoleConfigs = (): Record<string, RoleRuntimeConfig> =>
  Object.fromEntries(roleDefinitions.map((role) => [role.id, createDefaultRoleConfig(role.id)]));

interface RoleTaskInputCard {
  sourceRoleId: string;
  card: string;
  content: string;
}

// Test-only observability hooks (message/sound logs, addAgent wrapper, selectAgent).
// Installed only under the e2e harness so they never patch prototypes or grow
// unbounded logs in a real user's session.
if (isE2E) installTestHooks(officeStateRef);

function getOfficeState(): OfficeState {
  if (!officeStateRef.current) {
    officeStateRef.current = new OfficeState();
  }
  return officeStateRef.current;
}

function buildRoleRunBatches(
  activeRoleIds: Set<string>,
  connections: EducationConnection[],
): string[][] {
  const roleOrder = roleDefinitions
    .map((role) => role.id)
    .filter((roleId) => activeRoleIds.has(roleId));
  const active = new Set(roleOrder);
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();

  for (const roleId of roleOrder) {
    incoming.set(roleId, new Set());
    outgoing.set(roleId, new Set());
  }

  for (const connection of connections) {
    if (!active.has(connection.sourceRoleId) || !active.has(connection.targetRoleId)) continue;
    incoming.get(connection.targetRoleId)?.add(connection.sourceRoleId);
    outgoing.get(connection.sourceRoleId)?.add(connection.targetRoleId);
  }

  const batches: string[][] = [];
  const remaining = new Set(roleOrder);
  while (remaining.size > 0) {
    const batch = roleOrder.filter(
      (roleId) =>
        remaining.has(roleId) &&
        [...(incoming.get(roleId) ?? [])].every((sourceRoleId) => !remaining.has(sourceRoleId)),
    );
    if (batch.length === 0) {
      batches.push(roleOrder.filter((roleId) => remaining.has(roleId)));
      break;
    }
    batches.push(batch);
    for (const roleId of batch) {
      remaining.delete(roleId);
      for (const targetRoleId of outgoing.get(roleId) ?? []) {
        incoming.get(targetRoleId)?.delete(roleId);
      }
    }
  }

  return batches;
}

function App() {
  // Browser runtime (dev or static dist): dispatch mock messages after the
  // useExtensionMessages listener has been registered.
  useEffect(() => {
    // browserMock is for Vite dev mode only (UI prototyping without a server).
    // In standalone server mode, the server sends all state over WebSocket.
    if (import.meta.env.DEV) {
      void import('./browserMock.js')
        .then(async ({ dispatchMockMessages, initBrowserMock }) => {
          await initBrowserMock();
          dispatchMockMessages();
        })
        .catch((error) => {
          console.error('[BrowserMock] Failed to initialize', error);
        });
    }
  }, []);

  const editor = useEditorActions(getOfficeState, editorState);

  const isEditDirty = useCallback(
    () => editor.isEditMode && editor.isDirty,
    [editor.isEditMode, editor.isDirty],
  );

  const {
    agents,
    selectedAgent,
    agentTools,
    agentStatuses,
    agentAwaitingInput,
    subagentTools,
    subagentCharacters,
    layoutReady,
    layoutWasReset,
    loadedAssets,
    externalAssetDirectories,
    lastSeenVersion,
    extensionVersion,
    watchAllSessions,
    setWatchAllSessions,
    alwaysShowLabels,
    hooksEnabled,
    setHooksEnabled,
    hooksInfoShown,
    roleTaskConsoleEntries,
    lastRoleTaskStatus,
  } = useExtensionMessages(getOfficeState, editor.setLastSavedLayout, isEditDirty);

  // Show migration notice once layout reset is detected
  const [migrationNoticeDismissed, setMigrationNoticeDismissed] = useState(false);
  const showMigrationNotice = layoutWasReset && !migrationNoticeDismissed;

  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHooksInfoOpen, setIsHooksInfoOpen] = useState(false);
  const [hooksTooltipDismissed, setHooksTooltipDismissed] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [alwaysShowOverlay, setAlwaysShowOverlay] = useState(false);
  const [activeRoleIds, setActiveRoleIds] = useState<Set<string>>(() => new Set());
  const [roleConfigs, setRoleConfigs] =
    useState<Record<string, RoleRuntimeConfig>>(createInitialRoleConfigs);
  const [configRoleId, setConfigRoleId] = useState<string | null>(null);
  const roleConfigsRef = useRef<Record<string, RoleRuntimeConfig>>(createInitialRoleConfigs());
  const [educationRunStatus, setEducationRunStatus] = useState<EducationRunStatus>('idle');
  const runBatchesRef = useRef<string[][]>([]);
  const runConnectionsRef = useRef<EducationConnection[]>([]);
  const pausedBatchRef = useRef<string[] | null>(null);
  const pauseRequestedRef = useRef(false);
  const runningRoleIdsRef = useRef<Set<string>>(new Set());
  const roleAttemptCountsRef = useRef<Map<string, number>>(new Map());
  const roleOutputsRef = useRef<Map<string, string>>(new Map());
  const seenRoleOutputEntryIdsRef = useRef<Set<number>>(new Set());

  const currentMajorMinor = toMajorMinor(extensionVersion);

  useEffect(() => {
    roleConfigsRef.current = roleConfigs;
  }, [roleConfigs]);

  useEffect(() => {
    if (!layoutReady) return;

    const newsRoleIds = new Set(newsSummaryRoleDefinitions.map((role) => role.id));
    const os = getOfficeState();

    for (const role of roleDefinitions) {
      if (newsRoleIds.has(role.id)) continue;

      const roleAgentId = getRoleAgentId(role.id);
      const ch = os.characters.get(roleAgentId);
      if (ch?.seatId) {
        const seat = os.seats.get(ch.seatId);
        if (seat) seat.assigned = false;
      }
      os.characters.delete(roleAgentId);
      if (os.selectedAgentId === roleAgentId) os.selectedAgentId = null;
      if (os.cameraFollowId === roleAgentId) os.cameraFollowId = null;
    }

    setActiveRoleIds((prev) => new Set([...prev].filter((roleId) => newsRoleIds.has(roleId))));
  }, [layoutReady]);

  const handleWhatsNewDismiss = useCallback(() => {
    transport.send({ type: 'setLastSeenVersion', version: currentMajorMinor });
  }, [currentMajorMinor]);

  const handleOpenChangelog = useCallback(() => {
    setIsChangelogOpen(true);
    transport.send({ type: 'setLastSeenVersion', version: currentMajorMinor });
  }, [currentMajorMinor]);

  // Sync alwaysShowOverlay from persisted settings
  useEffect(() => {
    setAlwaysShowOverlay(alwaysShowLabels);
  }, [alwaysShowLabels]);

  const handleToggleDebugMode = useCallback(() => setIsDebugMode((prev) => !prev), []);
  const handleToggleAlwaysShowOverlay = useCallback(() => {
    setAlwaysShowOverlay((prev) => {
      const newVal = !prev;
      transport.send({ type: 'setAlwaysShowLabels', enabled: newVal });
      return newVal;
    });
  }, []);

  const handleSelectAgent = useCallback((id: number) => {
    transport.send({ type: 'focusAgent', id });
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  const [editorTickForKeyboard, setEditorTickForKeyboard] = useState(0);
  useEditorKeyboard(
    editor.isEditMode,
    editorState,
    editor.handleDeleteSelected,
    editor.handleRotateSelected,
    editor.handleToggleState,
    editor.handleUndo,
    editor.handleRedo,
    useCallback(() => setEditorTickForKeyboard((n) => n + 1), []),
    editor.handleToggleEditMode,
  );

  const handleCloseAgent = useCallback((id: number) => {
    transport.send({ type: 'closeAgent', id });
  }, []);

  const handleClick = useCallback((agentId: number) => {
    // If clicked agent is a sub-agent, focus the parent's terminal instead
    const os = getOfficeState();
    const meta = os.subagentMeta.get(agentId);
    const focusId = meta ? meta.parentAgentId : agentId;
    transport.send({ type: 'focusAgent', id: focusId });
  }, []);

  const handleRoleDrop = useCallback((roleId: string, col: number, row: number) => {
    const role = getRoleDefinition(roleId);
    if (!role) return;
    const id = getRoleAgentId(roleId);
    const os = getOfficeState();
    os.addRoleAgentAtTile(id, role.palette, col, row, role.name);
    const ch = os.characters.get(id);
    if (ch) ch.roleTaskIcon = role.roleTaskIcon;
    os.selectedAgentId = id;
    os.cameraFollowId = id;
    setActiveRoleIds((prev) => new Set(prev).add(roleId));
  }, []);

  useEffect(() => {
    for (const entry of roleTaskConsoleEntries) {
      if (seenRoleOutputEntryIdsRef.current.has(entry.id)) continue;
      seenRoleOutputEntryIdsRef.current.add(entry.id);
      if (entry.status === 'done' && entry.content.trim()) {
        const content = entry.content.trim();
        roleOutputsRef.current.set(entry.roleId, content);
      }
    }
  }, [roleTaskConsoleEntries]);

  const getRoleInputCards = useCallback(
    (roleId: string): RoleTaskInputCard[] => {
      return runConnectionsRef.current
        .filter((connection) => connection.targetRoleId === roleId)
        .map((connection) => {
          const content =
            roleOutputsRef.current.get(connection.sourceRoleId) ??
            [...roleTaskConsoleEntries]
              .reverse()
              .find(
                (entry) =>
                  entry.roleId === connection.sourceRoleId &&
                  entry.status === 'done' &&
                  entry.content.trim(),
              )
              ?.content.trim();
          if (!content) return null;
          return {
            sourceRoleId: connection.sourceRoleId,
            card: connection.card,
            content,
          };
        })
        .filter((input): input is RoleTaskInputCard => input !== null);
    },
    [roleTaskConsoleEntries],
  );

  const startRoleTask = useCallback(
    (roleId: string) => {
      const os = getOfficeState();
      const roleConfig = roleConfigsRef.current[roleId];
      roleAttemptCountsRef.current.set(roleId, (roleAttemptCountsRef.current.get(roleId) ?? 0) + 1);
      const roleAgentId = getRoleAgentId(roleId);
      os.setRoleTaskWorking(roleAgentId);
      const ch = os.characters.get(roleAgentId);
      transport.send({
        type: 'startRoleTask',
        roleId,
        col: ch?.tileCol ?? 0,
        row: ch?.tileRow ?? 0,
        inputCards: getRoleInputCards(roleId),
        taskOverride: roleConfig?.markdown.trim()
          ? {
              markdown: roleConfig.markdown,
            }
          : undefined,
      });
    },
    [getRoleInputCards],
  );

  const clearRoleTaskVisuals = useCallback((roleIds: Iterable<string>) => {
    const os = getOfficeState();
    for (const roleId of roleIds) {
      os.clearRoleTaskState(getRoleAgentId(roleId));
    }
  }, []);

  const startRoleBatch = useCallback(
    (roleIds: string[]) => {
      setEducationRunStatus('running');
      runningRoleIdsRef.current = new Set(roleIds);
      for (const roleId of roleIds) {
        startRoleTask(roleId);
      }
    },
    [startRoleTask],
  );

  const handleRunTeam = useCallback(
    (connections: EducationConnection[]) => {
      if (activeRoleIds.size === 0) return;
      editor.handleSetEditMode(false);
      setEducationRunStatus('running');
      pauseRequestedRef.current = false;
      pausedBatchRef.current = null;
      roleAttemptCountsRef.current = new Map();
      roleOutputsRef.current = new Map();
      seenRoleOutputEntryIdsRef.current = new Set();
      runConnectionsRef.current = connections;
      const batches = buildRoleRunBatches(activeRoleIds, connections);
      const firstBatch = batches.shift();
      runBatchesRef.current = batches;
      if (firstBatch) startRoleBatch(firstBatch);
    },
    [activeRoleIds, editor, startRoleBatch],
  );

  useEffect(() => {
    if (!lastRoleTaskStatus) return;
    if (lastRoleTaskStatus.status !== 'done' && lastRoleTaskStatus.status !== 'error') return;
    if (!runningRoleIdsRef.current.has(lastRoleTaskStatus.roleId)) {
      if (educationRunStatus !== 'running' && educationRunStatus !== 'pausing') {
        clearRoleTaskVisuals([lastRoleTaskStatus.roleId]);
      }
      return;
    }

    if (lastRoleTaskStatus.status === 'error') {
      const attempts = roleAttemptCountsRef.current.get(lastRoleTaskStatus.roleId) ?? 1;
      if (attempts < MAX_ROLE_TASK_ATTEMPTS) {
        startRoleTask(lastRoleTaskStatus.roleId);
        return;
      }

      runningRoleIdsRef.current = new Set();
      runBatchesRef.current = [];
      pausedBatchRef.current = null;
      pauseRequestedRef.current = false;
      setEducationRunStatus('error');
      return;
    }

    const nextRunning = new Set(runningRoleIdsRef.current);
    nextRunning.delete(lastRoleTaskStatus.roleId);
    runningRoleIdsRef.current = nextRunning;
    if (nextRunning.size > 0) return;

    const nextBatch = runBatchesRef.current.shift();
    if (nextBatch) {
      if (pauseRequestedRef.current) {
        pausedBatchRef.current = nextBatch;
        pauseRequestedRef.current = false;
        clearRoleTaskVisuals(roleDefinitions.map((role) => role.id));
        setEducationRunStatus('paused');
        return;
      }
      startRoleBatch(nextBatch);
      return;
    }

    setEducationRunStatus('completed');
  }, [clearRoleTaskVisuals, educationRunStatus, lastRoleTaskStatus, startRoleBatch, startRoleTask]);

  const handlePauseRun = useCallback(() => {
    if (educationRunStatus !== 'running') return;
    pauseRequestedRef.current = true;
    setEducationRunStatus('pausing');
  }, [educationRunStatus]);

  const handleResumeRun = useCallback(() => {
    if (educationRunStatus !== 'paused') return;
    const nextBatch = pausedBatchRef.current ?? runBatchesRef.current.shift();
    pausedBatchRef.current = null;
    pauseRequestedRef.current = false;
    if (nextBatch) {
      startRoleBatch(nextBatch);
      return;
    }
    setEducationRunStatus('completed');
  }, [educationRunStatus, startRoleBatch]);

  const handleStopRun = useCallback(() => {
    clearRoleTaskVisuals(roleDefinitions.map((role) => role.id));
    runningRoleIdsRef.current = new Set();
    runBatchesRef.current = [];
    pausedBatchRef.current = null;
    pauseRequestedRef.current = false;
    setEducationRunStatus('idle');
  }, [clearRoleTaskVisuals]);

  const handleBackToEdit = useCallback(() => {
    clearRoleTaskVisuals(roleDefinitions.map((role) => role.id));
    runningRoleIdsRef.current = new Set();
    runBatchesRef.current = [];
    pausedBatchRef.current = null;
    pauseRequestedRef.current = false;
    setEducationRunStatus('idle');
    editor.handleSetEditMode(true);
  }, [clearRoleTaskVisuals, editor]);

  const handleConfigureRole = useCallback((roleId: string) => {
    setConfigRoleId(roleId);
  }, []);

  const handleSaveRoleConfig = useCallback((config: RoleRuntimeConfig) => {
    roleConfigsRef.current = { ...roleConfigsRef.current, [config.roleId]: config };
    setRoleConfigs((prev) => ({ ...prev, [config.roleId]: config }));
  }, []);

  const handleRunSingleRole = useCallback(
    (config: RoleRuntimeConfig) => {
      roleConfigsRef.current = { ...roleConfigsRef.current, [config.roleId]: config };
      setRoleConfigs((prev) => ({ ...prev, [config.roleId]: config }));
      setConfigRoleId(null);
      editor.handleSetEditMode(false);
      setEducationRunStatus('running');
      pauseRequestedRef.current = false;
      pausedBatchRef.current = null;
      roleAttemptCountsRef.current = new Map();
      roleOutputsRef.current = new Map();
      seenRoleOutputEntryIdsRef.current = new Set();
      runConnectionsRef.current = [];
      runBatchesRef.current = [];
      window.setTimeout(() => startRoleBatch([config.roleId]), 0);
    },
    [editor, startRoleBatch],
  );

  const officeState = getOfficeState();

  // Force dependency on editorTickForKeyboard to propagate keyboard-triggered re-renders
  void editorTickForKeyboard;

  // Show "Press R to rotate" hint when a rotatable item is selected or being placed
  const showRotateHint =
    editor.isEditMode &&
    (() => {
      if (editorState.selectedFurnitureUid) {
        const item = officeState
          .getLayout()
          .furniture.find((f) => f.uid === editorState.selectedFurnitureUid);
        if (item && isRotatable(item.type)) return true;
      }
      if (
        editorState.activeTool === EditTool.FURNITURE_PLACE &&
        isRotatable(editorState.selectedFurnitureType)
      ) {
        return true;
      }
      return false;
    })();

  if (!layoutReady) {
    return <div className="w-full h-full flex items-center justify-center ">Loading...</div>;
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <OfficeCanvas
        officeState={officeState}
        onClick={handleClick}
        isEditMode={editor.isEditMode}
        editorState={editorState}
        onEditorTileAction={editor.handleEditorTileAction}
        onEditorEraseAction={editor.handleEditorEraseAction}
        onEditorSelectionChange={editor.handleEditorSelectionChange}
        onDeleteSelected={editor.handleDeleteSelected}
        onRotateSelected={editor.handleRotateSelected}
        onDragMove={editor.handleDragMove}
        onRoleDrop={handleRoleDrop}
        editorTick={editor.editorTick}
        zoom={editor.zoom}
        onZoomChange={editor.handleZoomChange}
        panRef={editor.panRef}
      />

      {!isDebugMode ? (
        <>
          <ZoomControls zoom={editor.zoom} onZoomChange={editor.handleZoomChange} />

          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'var(--vignette)' }}
          />

          {editor.isEditMode && editor.isDirty && (
            <EditActionBar editor={editor} editorState={editorState} />
          )}

          {showRotateHint && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-11 bg-accent-bright text-white text-sm py-3 px-8 rounded-none border-2 border-accent shadow-pixel pointer-events-none whitespace-nowrap"
              style={{ top: editor.isDirty ? 64 : 8 }}
            >
              Rotate (R)
            </div>
          )}

          {editor.isEditMode &&
            (() => {
              const selUid = editorState.selectedFurnitureUid;
              const selColor = selUid
                ? (officeState.getLayout().furniture.find((f) => f.uid === selUid)?.color ?? null)
                : null;
              return (
                <EditorToolbar
                  activeTool={editorState.activeTool}
                  selectedTileType={editorState.selectedTileType}
                  selectedFurnitureType={editorState.selectedFurnitureType}
                  selectedFurnitureUid={selUid}
                  selectedFurnitureColor={selColor}
                  floorColor={editorState.floorColor}
                  wallColor={editorState.wallColor}
                  selectedWallSet={editorState.selectedWallSet}
                  onToolChange={editor.handleToolChange}
                  onTileTypeChange={editor.handleTileTypeChange}
                  onFloorColorChange={editor.handleFloorColorChange}
                  onWallColorChange={editor.handleWallColorChange}
                  onWallSetChange={editor.handleWallSetChange}
                  onSelectedFurnitureColorChange={editor.handleSelectedFurnitureColorChange}
                  onFurnitureTypeChange={editor.handleFurnitureTypeChange}
                  loadedAssets={loadedAssets}
                  activePetTypes={officeState.getActivePetTypes()}
                  petCount={getPetCount()}
                  onPetToggle={editor.handlePetToggle}
                />
              );
            })()}

          <ToolOverlay
            officeState={officeState}
            agents={agents}
            agentTools={agentTools}
            agentAwaitingInput={agentAwaitingInput}
            subagentCharacters={subagentCharacters}
            containerRef={containerRef}
            zoom={editor.zoom}
            panRef={editor.panRef}
            onCloseAgent={handleCloseAgent}
            alwaysShowOverlay={alwaysShowOverlay}
          />

          <EducationModeOverlay
            officeState={officeState}
            activeRoleIds={activeRoleIds}
            isEditMode={editor.isEditMode}
            runStatus={educationRunStatus}
            containerRef={containerRef}
            zoom={editor.zoom}
            panRef={editor.panRef}
            roleConfigs={roleConfigs}
            onConfigureRole={handleConfigureRole}
            onRunTeam={handleRunTeam}
            onPauseRun={handlePauseRun}
            onResumeRun={handleResumeRun}
            onStopRun={handleStopRun}
            onBackToEdit={handleBackToEdit}
          />

          {editor.isEditMode && <RoleDock activeRoleIds={activeRoleIds} />}

          <RoleConfigModal
            roleId={configRoleId}
            config={configRoleId ? roleConfigs[configRoleId] : undefined}
            onClose={() => setConfigRoleId(null)}
            onSave={handleSaveRoleConfig}
            onRunRole={handleRunSingleRole}
          />
        </>
      ) : (
        <DebugView
          agents={agents}
          selectedAgent={selectedAgent}
          agentTools={agentTools}
          agentStatuses={agentStatuses}
          subagentTools={subagentTools}
          officeState={officeState}
          onSelectAgent={handleSelectAgent}
        />
      )}

      {/* Hooks first-run tooltip */}
      {!hooksInfoShown && !hooksTooltipDismissed && (
        <Tooltip
          title="Instant Detection Active"
          position="top-right"
          onDismiss={() => {
            setHooksTooltipDismissed(true);
            transport.send({ type: 'setHooksInfoShown' });
          }}
        >
          <span className="text-sm text-text leading-none">
            Your agents now respond in real-time.{' '}
            <span
              className="text-accent cursor-pointer underline"
              onClick={() => {
                setIsHooksInfoOpen(true);
                setHooksTooltipDismissed(true);
                transport.send({ type: 'setHooksInfoShown' });
              }}
            >
              View more
            </span>
          </span>
        </Tooltip>
      )}

      {/* Hooks info modal */}
      <Modal
        isOpen={isHooksInfoOpen}
        onClose={() => setIsHooksInfoOpen(false)}
        title="Instant Detection is ON"
        zIndex={52}
      >
        <div className="text-base text-text px-10" style={{ lineHeight: 1.4 }}>
          <p className="mb-8">Your Lightory office now reacts in real-time:</p>
          <ul className="mb-8 pl-18 list-disc m-0">
            <li className="text-sm mb-2">Permission prompts appear instantly</li>
            <li className="text-sm mb-2">Turn completions detected the moment they happen</li>
            <li className="text-sm mb-2">Sound notifications play immediately</li>
          </ul>
          <p className="mb-12 text-text-muted">
            This works through Claude Code Hooks, small event listeners that notify Lightory
            whenever something happens in your Claude sessions.
          </p>
          <div className="text-center">
            <button
              onClick={() => setIsHooksInfoOpen(false)}
              className="py-4 px-20 text-lg bg-accent text-white border-2 border-accent rounded-none cursor-pointer shadow-pixel"
            >
              Got it
            </button>
          </div>
          <p className="mt-8 text-xs text-text-muted text-center">
            To disable, go to Settings {'>'} Instant Detection
          </p>
        </div>
      </Modal>

      <RoleTaskConsole
        entries={roleTaskConsoleEntries}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen((v) => !v)}
      />

      <VersionIndicator
        currentVersion={extensionVersion}
        lastSeenVersion={lastSeenVersion}
        onDismiss={handleWhatsNewDismiss}
        onOpenChangelog={handleOpenChangelog}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        currentVersion={extensionVersion}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDebugMode={isDebugMode}
        onToggleDebugMode={handleToggleDebugMode}
        alwaysShowOverlay={alwaysShowOverlay}
        onToggleAlwaysShowOverlay={handleToggleAlwaysShowOverlay}
        externalAssetDirectories={externalAssetDirectories}
        watchAllSessions={watchAllSessions}
        onToggleWatchAllSessions={() => {
          const newVal = !watchAllSessions;
          setWatchAllSessions(newVal);
          transport.send({ type: 'setWatchAllSessions', enabled: newVal });
        }}
        hooksEnabled={hooksEnabled}
        onToggleHooksEnabled={() => {
          const newVal = !hooksEnabled;
          setHooksEnabled(newVal);
          transport.send({ type: 'setHooksEnabled', enabled: newVal });
        }}
      />

      {showMigrationNotice && (
        <MigrationNotice onDismiss={() => setMigrationNoticeDismissed(true)} />
      )}
    </div>
  );
}

export default App;
