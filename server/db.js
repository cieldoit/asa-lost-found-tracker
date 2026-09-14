const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Local MySQL can omit TLS; hosted MySQL must use verified TLS.
const useTLS = process.env.DB_SSL === 'true';
const caFile = process.env.DB_SSL_CA_PATH;
const ssl = useTLS ? {
  rejectUnauthorized: true,
  ...(caFile ? { ca: fs.readFileSync(path.resolve(__dirname, caFile), 'utf8') } : {})
} : undefined;

const db = mysql.createPool({
  ssl,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 15000,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  maxIdle: Number(process.env.DB_MAX_IDLE) || 10,
  idleTimeout: Number(process.env.DB_IDLE_TIMEOUT) || 60000,
  queueLimit: Number(process.env.DB_QUEUE_LIMIT) || 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

module.exports = db;
