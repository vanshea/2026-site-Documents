import { spawnSync } from "node:child_process";

const commands = [
  ["node", ["scripts/create-dynamic-backup.mjs"]],
  ["node", ["scripts/create-siteground-static-bundle.mjs"]]
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd()
  });

  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    break;
  }
}
