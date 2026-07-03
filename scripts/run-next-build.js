const { spawn } = require('child_process');
const path = require('path');

const workspaceRoot = path.join(__dirname, '..');
const nextBin = path.join(workspaceRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        ...extraEnv,
      },
      stdio: 'inherit',
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function main() {
  await run(process.execPath, [nextBin, 'build'], {
    NODE_OPTIONS: '--max-old-space-size=6144',
    NEXT_DIST_DIR: '.next-build',
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
