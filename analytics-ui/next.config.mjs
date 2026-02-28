import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/analytics",
  experimental: {
    typedRoutes: false,
    externalDir: true,
    outputFileTracingRoot: path.join(currentDir, ".."),
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"]
    }
  }
};

export default nextConfig;
