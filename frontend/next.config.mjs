/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Offline-first: disable remote font optimization that fetches from Google Fonts
  optimizeFonts: false,
  // Proxy API requests in dev to Express backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*` : 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
