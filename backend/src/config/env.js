const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value || String(value).trim().length === 0) {
    throw new Error(`Missing env var ${name}`);
  }
  return value;
}

// Parse ALLOWED_ORIGINS from comma-separated env var
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173';
  return origins.split(',').map((origin) => origin.trim());
};

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ? Number(process.env.PORT) : 3001,

  databaseUrl: process.env.DATABASE_URL,

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  allowedOrigins: getAllowedOrigins(),
};

module.exports = { env, requireEnv };
