module.exports = {
  apps: [
    {
      name: 'gamrdigital',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/gamrdigital',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
        DATABASE_URL: 'file:/var/www/gamrdigital/prisma/prod.db',
        JWT_SECRET: 'CHANGE_THIS_TO_A_SECURE_SECRET_KEY_MIN_32_CHARS',
        JWT_EXPIRES_IN: '24h',
        FRONTEND_URL: 'https://gamrdigitale.engage-360.net',
        CORS_ORIGIN: 'https://gamrdigitale.engage-360.net',
        RATE_LIMIT_WINDOW_MS: '900000',
        RATE_LIMIT_MAX: '300'
      },
      error_file: '/var/www/gamrdigital/logs/error.log',
      out_file: '/var/www/gamrdigital/logs/out.log',
      log_file: '/var/www/gamrdigital/logs/combined.log',
      time: true,
      merge_logs: true
    }
  ]
};

