// Judge worker. One instance per role (compiler / runner); the page kills the runner on TLE.
const CLANG_URL = 'https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20542-10/gen/bundle.js';
const WASI_URL = 'https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/dist/index.js';
const PYODIDE_URL = 'https://cdn.jsdelivr.net/npm/pyodide@314.0.7/pyodide.mjs';

const STDCPP = [
  'algorithm', 'array', 'bitset', 'cassert', 'cctype', 'climits', 'cmath', 'complex', 'cstdint',
  'cstdio', 'cstdlib', 'cstring', 'deque', 'functional', 'iomanip', 'iostream', 'iterator',
  'limits', 'list', 'map', 'numeric', 'queue', 'random', 'set', 'sstream', 'stack', 'string',
  'tuple', 'unordered_map', 'unordered_set', 'utility', 'vector', 'chrono', 'cfloat', 'bit',
  'optional', 'variant', 'memory', 'ranges', 'numbers', 'string_view',
].map(h => `#include <${h}>`).join('\n') + '\n';

const OUT_LIMIT = 4 << 20;
const dec = new TextDecoder();
let clang = null, clangP = null, wasiLib = null, pyP = null, pyJudge = null, cppModule = null;
let curId = 0;

function post(msg) { self.postMessage({ id: curId, ...msg }); }

async function loadClang() {
  clangP = clangP || import(CLANG_URL).then(m => { clang = m; });
  await clangP;
}

async function compileCpp(src) {
  await loadClang();
  let log = '';
  const errOut = b => { if (b) log += dec.decode(b); };
  const t0 = performance.now();
  try {
    const files = await clang.runClang(
      ['clang++', '-O2', '-std=c++20', '-fno-exceptions', '-Wl,-z,stack-size=67108864', '-Iinc', 'main.cpp', '-o', 'a.wasm'],
      { 'main.cpp': src, 'inc': { 'bits': { 'stdc++.h': STDCPP } } },
      {
        stderr: errOut, stdout: errOut,
        fetchProgress: ({ totalLength, doneLength }) =>
          post({ type: 'progress', text: `下载编译器 ${(doneLength / 1048576).toFixed(0)} / ${(totalLength / 1048576).toFixed(0)} MB` }),
      });
    return { ok: true, wasm: files['a.wasm'], log, ms: performance.now() - t0 };
  } catch (e) {
    return { ok: false, log: log || String(e && e.message || e) };
  }
}

async function runCpp(input) {
  if (!wasiLib) wasiLib = await import(WASI_URL);
  const { WASI, File, OpenFile, ConsoleStdout } = wasiLib;
  const out = [], err = [];
  let outLen = 0, ole = false;
  const fds = [
    new OpenFile(new File(input)),
    new ConsoleStdout(b => { outLen += b.length; if (outLen > OUT_LIMIT) ole = true; else out.push(b.slice()); }),
    new ConsoleStdout(b => { if (err.length < 200) err.push(b.slice()); }),
  ];
  const wasi = new WASI(['main'], [], fds, { debug: false });
  const inst = await WebAssembly.instantiate(cppModule, { wasi_snapshot_preview1: wasi.wasiImport });
  const t0 = performance.now();
  let code = 0, trap = '';
  try { code = wasi.start(inst); } catch (e) { trap = String(e && e.message || e); }
  const ms = performance.now() - t0;
  const join = arr => dec.decode(concat(arr));
  if (ole) return { status: 'OLE', ms, stdout: '', stderr: join(err) };
  if (trap || code !== 0) return { status: 'RE', ms, stdout: join(out), stderr: (trap ? trap + '\n' : `exit code ${code}\n`) + join(err) };
  return { status: 'OK', ms, stdout: join(out), stderr: join(err) };
}

function concat(arr) {
  let n = 0; for (const a of arr) n += a.length;
  const r = new Uint8Array(n); let o = 0;
  for (const a of arr) { r.set(a, o); o += a.length; }
  return r;
}

const PY_HARNESS = `
import sys, io, time, traceback
def __judge(src, data):
    if hasattr(data, "to_bytes"):
        data = data.to_bytes()
    try:
        co = compile(src, "main.py", "exec")
    except SyntaxError:
        return ("CE", "", traceback.format_exc(limit=0), 0.0)
    old_in, old_out = sys.stdin, sys.stdout
    out = io.StringIO()
    sys.stdin = io.TextIOWrapper(io.BytesIO(data))
    sys.stdout = out
    status, err = "OK", ""
    sys.setrecursionlimit(10000)
    t0 = time.perf_counter()
    try:
        exec(co, {"__name__": "__main__"})
    except SystemExit as e:
        if e.code not in (None, 0):
            status, err = "RE", "SystemExit(%r)" % (e.code,)
    except BaseException:
        status, err = "RE", traceback.format_exc()
    dt = time.perf_counter() - t0
    sys.stdin, sys.stdout = old_in, old_out
    return (status, out.getvalue(), err, dt)
`;

async function loadPy() {
  pyP = pyP || (async () => {
    post({ type: 'progress', text: '加载 Python (Pyodide)…' });
    const { loadPyodide } = await import(PYODIDE_URL);
    const py = await loadPyodide();
    py.runPython(PY_HARNESS);
    pyJudge = py.globals.get('__judge');
  })();
  await pyP;
}

async function runPy(src, input) {
  await loadPy();
  const r = pyJudge(src, input);
  const [status, stdout, stderr, sec] = r.toJs();
  r.destroy();
  if (stdout.length > OUT_LIMIT) return { status: 'OLE', ms: sec * 1000, stdout: '', stderr };
  return { status, ms: sec * 1000, stdout, stderr };
}

self.onmessage = async ({ data: m }) => {
  const id = m.id;
  const post = msg => self.postMessage({ id, ...msg });
  curId = id;
  try {
    if (m.type === 'preload-cpp') { await loadClang(); post({ type: 'ready' }); }
    else if (m.type === 'preload-py') { await loadPy(); post({ type: 'ready' }); }
    else if (m.type === 'compile') post({ type: 'compiled', ...(await compileCpp(m.src)) });
    else if (m.type === 'load-wasm') { cppModule = await WebAssembly.compile(m.wasm); post({ type: 'ready' }); }
    else if (m.type === 'run-cpp') post({ type: 'result', ...(await runCpp(m.input)) });
    else if (m.type === 'run-py') post({ type: 'result', ...(await runPy(m.src, m.input)) });
  } catch (e) {
    post({ type: 'error', text: String(e && e.stack || e) });
  }
};
