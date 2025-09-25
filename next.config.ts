import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental: {
  //   serverComponentsExternalPackages: ["knex", "better-sqlite3"],
  // },
  serverExternalPackages: ["knex", "better-sqlite3"],
};

export default nextConfig;
