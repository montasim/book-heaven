/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb', // Set to 12MB to allow for 10MB files plus overhead
    },
  },
};

module.exports = nextConfig;
