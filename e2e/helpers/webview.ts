import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Settings/modal helpers for the standalone browser page.
 */
type WebviewSurface = Page;

const WEBVIEW_TIMEOUT_MS = 30_000;

export interface WebviewSettings {
  watchAllSessions?: boolean;
  hooksEnabled?: boolean;
  alwaysShowLabels?: boolean;
  debugView?: boolean;
}

async function setCheckbox(modal: Locator, label: string, checked: boolean): Promise<void> {
  const button = modal.locator('button', { hasText: label });
  await expect(button).toBeVisible({ timeout: WEBVIEW_TIMEOUT_MS });

  const indicator = button.locator('span').last();
  const isChecked = ((await indicator.textContent()) ?? '').trim().toLowerCase() === 'x';
  if (isChecked !== checked) {
    await button.click();
  }
}

async function openSettingsModal(frame: WebviewSurface): Promise<Locator> {
  const settingsButton = frame.locator('button', { hasText: 'Settings' });
  await expect(settingsButton).toBeVisible({ timeout: WEBVIEW_TIMEOUT_MS });
  await settingsButton.click();

  const settingsModal = frame
    .locator('div.fixed')
    .filter({ has: frame.getByText('Settings', { exact: true }) });
  await expect(settingsModal).toBeVisible({ timeout: WEBVIEW_TIMEOUT_MS });
  return settingsModal;
}

async function closeSettingsModal(settingsModal: Locator): Promise<void> {
  const closeButton = settingsModal.getByRole('button', { name: 'x', exact: true });
  await expect(closeButton).toBeVisible({ timeout: WEBVIEW_TIMEOUT_MS });
  await closeButton.click();
  await expect(settingsModal).toBeHidden({ timeout: WEBVIEW_TIMEOUT_MS });
}

/**
 * Read the checked state of a Settings modal toggle without changing it.
 * Used by the settings-persistence test to assert state survives a panel reload.
 */
export async function getSettingChecked(frame: WebviewSurface, label: string): Promise<boolean> {
  const settingsModal = await openSettingsModal(frame);
  const button = settingsModal.locator('button', { hasText: label });
  await expect(button).toBeVisible({ timeout: WEBVIEW_TIMEOUT_MS });
  const indicator = button.locator('span').last();
  const checked = ((await indicator.textContent()) ?? '').trim().toLowerCase() === 'x';
  await closeSettingsModal(settingsModal);
  return checked;
}

export async function setSettings(frame: WebviewSurface, settings: WebviewSettings): Promise<void> {
  const settingsModal = await openSettingsModal(frame);

  if (settings.watchAllSessions !== undefined) {
    await setCheckbox(settingsModal, 'Watch All Sessions', settings.watchAllSessions);
  }
  if (settings.hooksEnabled !== undefined) {
    await setCheckbox(settingsModal, 'Instant Detection (Hooks)', settings.hooksEnabled);
  }
  if (settings.alwaysShowLabels !== undefined) {
    await setCheckbox(settingsModal, 'Always Show Labels', settings.alwaysShowLabels);
  }
  if (settings.debugView !== undefined) {
    await setCheckbox(settingsModal, 'Debug View', settings.debugView);
  }

  await closeSettingsModal(settingsModal);

  // Allow the server/WebSocket round trip to process settings updates before the test continues.
  await frame.waitForTimeout(500);
}

/**
 * Enable the settings needed for the hook-server e2e assertions:
 * - Watch All Sessions, so hooks-only external sessions are adopted
 * - Always Show Labels, so the normal office view exposes stable overlay text
 */
export async function configureHookServerTestSettings(frame: WebviewSurface): Promise<void> {
  await setSettings(frame, {
    watchAllSessions: true,
    hooksEnabled: true,
    alwaysShowLabels: true,
    debugView: false,
  });
}
