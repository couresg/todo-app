import { MongoMemoryServer } from "mongodb-memory-server";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const dbPath = resolve(process.cwd(), ".data", "db");
mkdirSync(dbPath, { recursive: true });

const mongod = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: "wiredTiger" },
});
console.log(`MongoDB running: ${mongod.getUri()}todo-app`);

let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  await mongod.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
