const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const entry = path.join(root, 'scripts', 'service-flow-check.ts');
const outDir = path.join(root, '.tmp-service-run');

function formatDiagnostics(diagnostics) {
  return diagnostics.map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    if (!diagnostic.file || diagnostic.start == null) {
      return message;
    }

    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return `${diagnostic.file.fileName}:${line + 1}:${character + 1} ${message}`;
  });
}

function ensureServerOnlyShim() {
  const shimDir = path.join(outDir, 'node_modules', 'server-only');
  fs.mkdirSync(shimDir, { recursive: true });
  fs.writeFileSync(path.join(shimDir, 'index.js'), 'module.exports = {};\\n');
  fs.writeFileSync(
    path.join(shimDir, 'package.json'),
    JSON.stringify(
      {
        name: 'server-only',
        version: '0.0.0-local',
        main: 'index.js',
      },
      null,
      2
    )
  );
}

function compile() {
  fs.rmSync(outDir, { recursive: true, force: true });

  const program = ts.createProgram([entry], {
    outDir,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    esModuleInterop: true,
    skipLibCheck: true,
    noEmitOnError: true,
  });

  const emitResult = program.emit();
  const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
  if (diagnostics.length > 0) {
    console.error(formatDiagnostics(diagnostics).join('\n'));
    process.exit(1);
  }

  ensureServerOnlyShim();
}

function run() {
  const compiledEntry = path.join(outDir, 'scripts', 'service-flow-check.js');
  const result = spawnSync(process.execPath, [compiledEntry], {
    cwd: root,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

compile();
run();
