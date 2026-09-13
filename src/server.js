const { config } = require('./config');
const { buildApp } = require('./app');

const app = buildApp();
app.listen({ port: config.port, host: config.host }).then(() => app.log.info(`JARVIS listening on ${config.host}:${config.port}`)).catch(error => { app.log.error(error); process.exit(1); });
