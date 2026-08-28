import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
        localPatterns: [
            {
                pathname: '/api/proxy/image',
                search: '**', // ✅ allow any query string
            },
        ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'drive.google.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'photos.app.goo.gl',
            },
        ],
    },
    // Reduce memory usage during builds
    experimental: {
        // Keep parallel build workers within Vercel's memory budget.
        cpus: 2,
        proxyClientMaxBodySize: '30mb',

        // Optimize package imports to reduce bundle size
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons',
            '@tabler/icons-react',
            '@tanstack/react-table',
            'recharts',
        ],
        // Configure server actions for large file uploads
        serverActions: {
            bodySizeLimit: '50mb', // Increased to 50mb for database backups and pdf uploads
        },
    },

    // Disable source maps in production to reduce memory usage
    productionBrowserSourceMaps: false,
};

export default nextConfig;
