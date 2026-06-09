const withNextIntl = require('next-intl/plugin')('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['knex', 'better-sqlite3'],
};

module.exports = withNextIntl(nextConfig);
