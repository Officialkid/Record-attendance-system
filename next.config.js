/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      {
        source: '/leadership',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
