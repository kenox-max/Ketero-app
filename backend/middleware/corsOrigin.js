const KETERO_VERCEL_HOST = /^ketero-app(?:-[a-z0-9-]+)*\.vercel\.app$/i;

const isAllowedCorsOrigin = (origin, allowedOrigins = []) => {
  if (!origin || allowedOrigins.includes(origin)) return true;

  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'https:' && KETERO_VERCEL_HOST.test(parsed.hostname);
  } catch {
    return false;
  }
};

const createCorsOriginHandler = (allowedOrigins) => (origin, callback) => {
  if (isAllowedCorsOrigin(origin, allowedOrigins)) {
    return callback(null, true);
  }
  return callback(new Error('Origin is not allowed by CORS'));
};

module.exports = { isAllowedCorsOrigin, createCorsOriginHandler };
