const { execFileSync, spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

const requestedPort = process.env.PORT;
const initialPort = Number(requestedPort || 3000);
const maxAttempts = requestedPort ? 1 : 10;
const host = process.env.HOST || "0.0.0.0";

function findExistingNextDevServer() {
  if (process.platform !== "win32") {
    return null;
  }

  try {
    const output = execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        "Get-CimInstance Win32_Process -Filter \"Name = 'node.exe'\" | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress",
      ],
      { encoding: "utf8" }
    ).trim();

    if (!output) {
      return null;
    }

    const entries = JSON.parse(output);
    const processes = Array.isArray(entries) ? entries : [entries];
    const projectDir = path.join(__dirname, "..").toLowerCase();
    const nextBinFragment = path.join("next", "dist", "bin", "next").toLowerCase();

    for (const processInfo of processes) {
      const commandLine = processInfo.CommandLine || "";
      const normalized = commandLine.toLowerCase();

      if (!normalized.includes(projectDir) || !normalized.includes(nextBinFragment) || !normalized.includes(" dev")) {
        continue;
      }

      const portMatch = commandLine.match(/(?:^|\s)-p\s+(\d+)/i);

      return {
        pid: processInfo.ProcessId,
        port: portMatch ? Number(portMatch[1]) : initialPort,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function isPortFree(port, hostname) {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        resolve(false);
        return;
      }

      resolve(false);
    });

    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, hostname);
  });
}

async function findPort() {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = initialPort + offset;
    // Check IPv6 unspecified first because Next binds there on Windows.
    const ipv6Free = await isPortFree(port, "::");
    const ipv4Free = await isPortFree(port, "0.0.0.0");

    if (ipv6Free && ipv4Free) {
      return port;
    }

    if (!requestedPort) {
      console.warn(`Port ${port} is busy, trying ${port + 1}...`);
    }
  }

  throw new Error(
    requestedPort
      ? `Port ${initialPort} is already in use. Set PORT to a free port and try again.`
      : `No free port found between ${initialPort} and ${initialPort + maxAttempts - 1}.`
  );
}

async function main() {
  if (!requestedPort) {
    const existingServer = findExistingNextDevServer();

    if (existingServer) {
      console.log(
        `Frontend dev server is already running on http://localhost:${existingServer.port} (PID: ${existingServer.pid}).`
      );
      return;
    }
  }

  const port = await findPort();
  const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");

  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host,
    },
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
