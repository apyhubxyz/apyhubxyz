/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['localhost', 'apyhub.xyz'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  },
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that cause warnings
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    // Suppress warnings for these modules
    config.ignoreWarnings = [
      { module: /node_modules\/@react-native-async-storage\/async-storage/ },
      { module: /node_modules\/pino-pretty/ },
    ];

    return config;
  },
}

module.exports = nextConfig