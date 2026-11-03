import fs from 'node:fs';
import path from 'node:path';

/**
 * Lightweight safe backend environment loader for Node.js runtime.
 * Loads variables from .env into process.env without leaking to client bundle.
 */
export function loadBackendEnv(): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;

    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) continue;

      const key = line.slice(0, eqIndex).trim();
      let value = line.slice(eqIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!process.env[key] && value) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

// Auto-run on server import
loadBackendEnv();

