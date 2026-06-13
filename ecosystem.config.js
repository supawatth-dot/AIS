// PM2 process manager config — use when running without Docker
// Install: npm install -g pm2
// Start:   pm2 start ecosystem.config.js --env production
// Monitor: pm2 monit
// Logs:    pm2 logs ais

module.exports = {
  apps: [
    {
      name: 'ais',
      script: 'server.js',
      instances: process.env.WEB_CONCURRENCY || 'max', // cluster mode
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '400M',

      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,

      // Restart policy
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '5s',

      // Graceful shutdown
      kill_timeout: 15000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
