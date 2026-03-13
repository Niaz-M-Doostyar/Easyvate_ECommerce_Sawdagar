/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
module.exports = {
  ...(isProd ? { basePath: '/sawdagar-admin' } : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['localhost', 'images.unsplash.com'],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' },
      { source: '/uploads/:path*', destination: 'http://localhost:4000/uploads/:path*' },
    ];
  },
};
