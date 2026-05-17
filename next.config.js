const withNextIntl = require('next-intl/plugin')('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para lidar com imagens do Leaflet
  images: {
    domains: [],
  },
}

module.exports = withNextIntl(nextConfig);

