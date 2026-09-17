/**
 * Root entry point for hosting panels that expect a file at the project root (Hostinger, cPanel, Passenger).
 * The application itself is TypeScript under src/ and is compiled to dist/src/server.js by `npm run build`,
 * so this file only forwards to the compiled output.
 */
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const entryPoint = join(__dirname, 'dist', 'src', 'server.js');

if (!existsSync(entryPoint)) {
  console.error(
    [
      '[BOOT] Compiled server not found at dist/src/server.js.',
      'Run "npm run build" before starting the application.',
    ].join('\n'),
  );

  process.exit(1);
}

require(entryPoint);
