module.exports = {
  apps: [
    {
      name: "chat-bot",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_restarts: 20,
      min_uptime: "5s",
      exp_backoff_restart_delay: 200,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
