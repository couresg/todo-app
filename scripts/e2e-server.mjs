// E2E stack: isolated in-memory MongoDB + production build served on :3300.
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn, spawnSync } from "node:child_process";

const PORT = process.env.E2E_PORT ?? "3300";
const mongod = await MongoMemoryServer.create();
const env = { ...process.env, MONGODB_URI: `${mongod.getUri()}todo-app-e2e` };

const build = spawnSync("npx next build", { env, stdio: "inherit", shell: true });
if (build.status !== 0) {
  await mongod.stop();
  process.exit(build.status ?? 1);
}

const server = spawn(`npx next start -p ${PORT}`, { env, stdio: "inherit", shell: true });

let stopping = false;
const stop = async (code = 0) => {
  if (stopping) return;
  stopping = true;
  if (process.platform === "win32") spawnSync(`taskkill /pid ${server.pid} /T /F`, { shell: true });
  else server.kill();
  await mongod.stop();
  process.exit(code);
};
server.on("exit", (code) => stop(code ?? 0));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
