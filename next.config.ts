import type { NextConfig } from "next";
import path from "path";

const wasmStub = path.resolve(process.cwd(), "satellite-wasm-stub.js");

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "#wasm-single-thread": wasmStub,
      "#wasm-multi-thread": wasmStub,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      module: false,
      fs: false,
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      "#wasm-single-thread": "./satellite-wasm-stub.js",
      "#wasm-multi-thread": "./satellite-wasm-stub.js",
    },
  },
};

export default nextConfig;
