module.exports = {
  apps: [
    {
      name: 'ah-api',
      script: './src/main.js',
      instances: '1',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      wait_ready: true,
      listen_timeout: 20000,
      kill_timeout: 5000
    },
  ],
};
