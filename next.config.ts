import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10gb'
    }
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'upgrade-insecure-requests'
          }
        ]
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https://*.youtube.com https://*.ytimg.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.youtube.com https://*.ytimg.com",
              "frame-src 'self' https://*.youtube.com",
              "connect-src 'self' https://*.youtube.com https://*.ytimg.com",
              "img-src 'self' https://*.youtube.com https://*.ytimg.com data:",
              "style-src 'self' 'unsafe-inline'",
              "media-src 'self' https://*.youtube.com https://*.ytimg.com",
              "frame-ancestors 'self'",
              "worker-src 'self' blob:"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
