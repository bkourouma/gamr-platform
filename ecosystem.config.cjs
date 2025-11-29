module.exports = {
  apps: [
    {
      name: 'gamr-platform',
      script: 'node_modules/.bin/tsx',
      args: 'src/server/simple-index.ts',
      cwd: '/var/www/gamr-platform',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/log/gamr/error.log',
      out_file: '/var/log/gamr/out.log',
      log_file: '/var/log/gamr/combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};

