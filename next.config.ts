import type { NextConfig } from "next";

// Sin cacheComponents: es una caja de dinero, cada pantalla se arma en el momento con datos frescos.
const nextConfig: NextConfig = {
  serverExternalPackages: ["mysql2", "exceljs", "bcryptjs"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
