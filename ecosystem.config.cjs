const path = require('path');

const root = __dirname;

module.exports = {
  apps: [
    {
      name: 'sawdagar-api',
      cwd: path.join(root, 'backend'),
      script: 'server.js',
      interpreter: 'node',
      autorestart: true,
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'sawdagar-storefront',
      cwd: path.join(root, 'website'),
      script: '.next/standalone/server.js',
      interpreter: 'node',
      autorestart: true,
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: 3000,
      },
    },
    {
      name: 'sawdagar-admin',
      cwd: path.join(root, 'admin'),
      script: '.next/standalone/server.js',
      interpreter: 'node',
      autorestart: true,
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: 3001,
      },
    },
  ],
};
