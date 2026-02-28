import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/analytics",
  experimental: {
    typedRoutes: false,
    externalDir: true,
    outputFileTracingRoot: path.join(currentDir, "..")
  }
};

export default nextConfig;
