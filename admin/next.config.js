/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
      { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
      { source: '/uploads/:path*', destination: `${apiOrigin}/uploads/:path*` },
    ];
  },
};
