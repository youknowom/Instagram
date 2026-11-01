#!/usr/bin/env node

const command = process.argv[2];

const COMMANDS: Record<string, () => Promise<void>> = {
  'ig:whoami': () => {
    throw new Error('NotImplementedError: ig:whoami');
  },
  'ig:publish-test': () => {
    throw new Error('NotImplementedError: ig:publish-test');
  },
  ingest: () => {
    throw new Error('NotImplementedError: ingest');
  },
  generate: () => {
    throw new Error('NotImplementedError: generate');
  },
  publish: () => {
    throw new Error('NotImplementedError: publish');
  },
  'sync-insights': () => {
    throw new Error('NotImplementedError: sync-insights');
  },
  'refresh-token': () => {
    throw new Error('NotImplementedError: refresh-token');
  },
};

async function main() {
  if (!command || !(command in COMMANDS)) {
    console.error(
      `Usage: ig-worker <command>\n\nCommands:\n${Object.keys(COMMANDS)
        .map((c) => `  ${c}`)
        .join('\n')}`,
    );
    process.exit(1);
  }
  await COMMANDS[command]();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
