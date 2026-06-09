module.exports = {
  apps: [
    {
      name: 'wellness-server',
      script: 'server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        WELLNESS_SECRET: 'wellness-secret-key'  // 生产环境请替换
      },
      max_memory_restart: '300M',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
