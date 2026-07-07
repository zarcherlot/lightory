import * as os from 'os';

export function getHomeDir(): string {
  return process.env['LIGHTORY_HOME'] || process.env['HOME'] || os.homedir();
}
