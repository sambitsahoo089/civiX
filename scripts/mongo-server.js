// Starts a local MongoDB server with data persisted to ./.mongo-data.
// Run with: npm run db:start
//
// The mongod binary is the one already downloaded by mongodb-memory-server into
// ./node_modules/.cache/mongodb-memory-server/. We spawn it directly instead of
// going through MongoMemoryServer.create(), whose default 10s startup watchdog
// trips on slow disks (e.g. OneDrive-backed folders) while mongod recovers its
// WiredTiger files.
const path = require("path");
const fs = require("fs");
const net = require("net");
const os = require("os");
const { spawn } = require("child_process");

const PORT = Number(process.env.MONGO_PORT || 5434);
const ROOT = process.cwd();
const LOG_FILE = path.join(ROOT, ".mongo-server.log");

// WiredTiger crashes (preplog lock errors, minidumps) when its data directory is
// inside a cloud-synced folder such as OneDrive — the sync client moves files
// under mongod's feet. Keep the data on the local disk instead. Override with
// MONGO_DATA_DIR if you want it somewhere specific.
function defaultDataDir() {
  const local = process.env.LOCALAPPDATA || process.env.XDG_DATA_HOME;
  if (local) return path.join(local, "freebuff-mongo-data");
  return path.join(os.homedir(), ".freebuff-mongo-data");
}

const DATA_DIR = process.env.MONGO_DATA_DIR
  ? path.resolve(process.env.MONGO_DATA_DIR)
  : defaultDataDir();

function findMongod() {
  const cacheDir = path.join(ROOT, "node_modules", ".cache", "mongodb-memory-server");
  if (!fs.existsSync(cacheDir)) return null;
  const candidates = fs
    .readdirSync(cacheDir)
    .filter((f) => /^mongod(-x64)?-.*\.exe$/i.test(f) || f === "mongod" || f === "mongod.exe")
    .map((f) => path.join(cacheDir, f));
  return candidates[0] || null;
}

function waitForPort(port, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({ host: "127.0.0.1", port });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) reject(new Error(`mongod did not open port ${port} in time`));
        else setTimeout(attempt, 500);
      });
    };
    attempt();
  });
}

// A hard restart (crash, killed terminal, IDE restart) can leave WiredTiger
// preplog files behind. mongod recovers fine from a stale lock, but it aborts
// with "Resource device: file in use" if it cannot delete a preplog, so clear
// them whenever nothing is already listening on our port.
function cleanupStaleArtifacts() {
  const journalDir = path.join(DATA_DIR, "journal");
  if (!fs.existsSync(journalDir)) return;
  for (const file of fs.readdirSync(journalDir)) {
    if (!/^WiredTigerPreplog\./.test(file)) continue;
    try {
      fs.rmSync(path.join(journalDir, file), { force: true });
      console.log(`[db] cleared stale ${file}`);
    } catch (err) {
      console.warn(`[db] could not clear ${file}: ${err.message}`);
    }
  }
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    const done = () => {
      socket.destroy();
      resolve(false);
    };
    socket.once("error", done);
    socket.once("timeout", done);
  });
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (await isPortOpen(PORT)) {
    console.log(`[db] MongoDB already running at mongodb://127.0.0.1:${PORT}`);
    return;
  }

  cleanupStaleArtifacts();

  const mongodPath = findMongod();
  if (!mongodPath) {
    console.error(
      "[db] No mongod binary in node_modules/.cache/mongodb-memory-server yet. " +
        "Run `node -e \"require('mongodb-memory-server').MongoMemoryServer.create()\"` once to download it."
    );
    process.exit(1);
  }

  const args = [
    "--dbpath",
    DATA_DIR,
    "--port",
    String(PORT),
    "--bind_ip",
    "127.0.0.1",
    "--logpath",
    LOG_FILE,
    "--logappend",
  ];

  console.log(`[db] data directory: ${DATA_DIR}`);
  console.log(`[db] launching ${path.basename(mongodPath)} on port ${PORT}`);
  const child = spawn(mongodPath, args, { stdio: "inherit", detached: false });

  child.on("exit", (code) => {
    console.error(`[db] mongod exited with code ${code}`);
    process.exit(code ?? 1);
  });

  waitForPort(PORT)
    .then(() => console.log(`[db] MongoDB ready at mongodb://127.0.0.1:${PORT}`))
    .catch((err) => {
      console.error(`[db] ${err.message}`);
      process.exit(1);
    });

  const shutdown = () => {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[db] failed to start:", err?.message || err);
  process.exit(1);
});
