/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during build (we run it separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build (we run it separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude libsql native modules from webpack bundling
  experimental: {
    serverComponentsExternalPackages: [
      '@libsql/client',
      '@prisma/adapter-libsql',
      'libsql',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic modules from server-side bundling
      config.externals = config.externals || [];
      config.externals.push({
        '@libsql/client': 'commonjs @libsql/client',
        '@prisma/adapter-libsql': 'commonjs @prisma/adapter-libsql',
      });
    }
    return config;
  },
};

export default nextConfig;
