/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // DECISIÓN: Se permiten imágenes del backend local en desarrollo
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
};

module.exports = nextConfig;
