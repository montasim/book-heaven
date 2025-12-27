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
    },
};

export default nextConfig;
