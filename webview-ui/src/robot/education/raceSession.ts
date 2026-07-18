export interface RaceSessionState {
  sessionId: string;
  active: boolean;
  recordedPoints: Array<'A' | 'B' | 'C' | 'D'>;
  nextPoint?: 'A' | 'B' | 'C' | 'D';
}

export function createRaceSessionState(sessionId: string): RaceSessionState {
  return {
    sessionId,
    active: false,
    recordedPoints: [],
  };
}

export function detectFourPointRaceIntent(input: string): boolean {
  const text = input.replace(/\s+/gu, '').toLowerCase();
  const hasRace = /竞速|计时赛|比赛|race/u.test(text);
  const hasFourPoint =
    /4点|四点|四个点|abcd|a、?b、?c、?d|a点.*b点.*c点.*d点/u.test(text);
  return hasRace && hasFourPoint;
}
