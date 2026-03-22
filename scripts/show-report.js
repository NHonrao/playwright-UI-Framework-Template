/**
 * show-report.js
 *
 * Kills any process occupying port 9323, then starts the Playwright report
 * server. Run via: npm run report
 */
const { execSync, spawn } = require('child_process');

const PORT = 9323;

// Kill whatever is currently holding the port (Windows + Unix compatible)
try {
  if (process.platform === 'win32') {
    const result = execSync(
      `netstat -ano | findstr :${PORT}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const lines = result.trim().split('\n');
    const pids = new Set(
      lines
        .map(l => l.trim().split(/\s+/).pop())
        .filter(pid => pid && pid !== '0')
    );
    pids.forEach(pid => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`Killed PID ${pid} (was using port ${PORT})`);
      } catch {
        // already gone
      }
    });
  } else {
    execSync(`lsof -ti :${PORT} | xargs kill -9`, { stdio: 'ignore' });
  }
} catch {
  // nothing was using the port — that's fine
}

// Small delay to let the OS release the port
setTimeout(() => {
  const child = spawn(
    'npx',
    ['playwright', 'show-report', '--port', String(PORT)],
    { stdio: 'inherit', shell: false }
  );
  child.on('error', err => {
    console.error('Failed to start report server:', err.message);
    process.exit(1);
  });
}, 500);
