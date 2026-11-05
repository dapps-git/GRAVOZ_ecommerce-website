const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  console.warn('⚠️  [Security Warning] JWT_SECRET environment variable is not defined.');
}

/**
 * Extract cookie value from request header
 */
function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Extract token from Bearer Authorization header, custom headers, or specified cookies
 */
function extractToken(req, cookieNames = ['gravoz_user_token', 'gravoz_admin_token']) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const xAccessToken = req.headers['x-access-token'] || req.headers['x-auth-token'];
  if (xAccessToken && typeof xAccessToken === 'string') {
    return xAccessToken.trim();
  }
  for (const name of cookieNames) {
    const val = getCookie(req, name);
    if (val) return val;
  }
  return null;
}

/**
 * Normalize decoded user payload so userId is always reliably available
 */
function normalizeUserPayload(decoded) {
  if (!decoded) return null;
  const userId = decoded.userId || decoded.id || decoded._id;
  if (!userId) return null;
  return {
    ...decoded,
    userId: String(userId),
    email: decoded.email ? String(decoded.email).toLowerCase().trim() : '',
  };
}

/**
 * Normalize decoded admin payload
 */
function normalizeAdminPayload(decoded) {
  if (!decoded) return null;
  const isAdmin = Boolean(
    decoded.adminId ||
    decoded.role === 'admin' ||
    decoded.role === 'superadmin' ||
    (decoded.email && decoded.email === process.env.ADMIN_EMAIL)
  );
  if (!isAdmin) return null;
  const adminId = decoded.adminId || decoded.id || decoded._id || 'admin';
  return {
    ...decoded,
    adminId: String(adminId),
    role: decoded.role || 'admin',
    email: decoded.email ? String(decoded.email).toLowerCase().trim() : '',
  };
}

/**
 * 1. Mandatory Customer/User Authentication
 * Requires valid customer JWT. Sets req.user.
 */
exports.authenticateUser = (req, res, next) => {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Server authentication configuration error.' });
  }

  const token = extractToken(req, ['gravoz_user_token', 'gravoz_user_refresh_token', 'token']);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = normalizeUserPayload(decoded);
    if (!user) {
      return res.status(401).json({ error: 'Invalid user session token.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
};

/**
 * 2. Optional Customer Authentication
 * If token is present, verifies and sets req.user / req.admin. Never fails if token is absent.
 */
exports.optionalUser = (req, res, next) => {
  if (!JWT_SECRET) return next();

  const token = extractToken(req, [
    'gravoz_user_token',
    'gravoz_user_refresh_token',
    'token',
    'gravoz_admin_token',
    'gravoz_admin_refresh_token',
    'admin_token',
  ]);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const admin = normalizeAdminPayload(decoded);
      if (admin) req.admin = admin;

      const user = normalizeUserPayload(decoded);
      if (user) req.user = user;
    } catch {
      // Ignored for optional auth
    }
  }
  next();
};

/**
 * 3. Mandatory Admin Authentication
 * Requires valid admin JWT. Sets req.admin.
 */
exports.authenticateAdmin = (req, res, next) => {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Server authentication configuration error.' });
  }

  const token = extractToken(req, ['gravoz_admin_token', 'gravoz_admin_refresh_token', 'admin_token']);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Admin authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = normalizeAdminPayload(decoded);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Admin session expired or invalid. Please log in again.' });
  }
};

/**
 * 4. Authenticate User OR Admin
 * Allows either valid customer or valid admin session. Sets req.user or req.admin.
 */
exports.authenticateUserOrAdmin = (req, res, next) => {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Server authentication configuration error.' });
  }

  const token = extractToken(req, [
    'gravoz_admin_token',
    'gravoz_admin_refresh_token',
    'admin_token',
    'gravoz_user_token',
    'gravoz_user_refresh_token',
    'token',
  ]);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Valid customer or admin session required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = normalizeAdminPayload(decoded);
    if (admin) {
      req.admin = admin;
      return next();
    }
    const user = normalizeUserPayload(decoded);
    if (user) {
      req.user = user;
      return next();
    }
    return res.status(401).json({ error: 'Invalid session token payload.' });
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
};
