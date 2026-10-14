const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gravoz_ecommerce_super_secure_jwt_secret_key_2026_xyz!';

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
 * Extract token from Bearer Authorization header or specified cookies
 */
function extractToken(req, cookieNames = ['gravoz_user_token', 'gravoz_admin_token']) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  for (const name of cookieNames) {
    const val = getCookie(req, name);
    if (val) return val;
  }
  return null;
}

/**
 * 1. Mandatory Customer/User Authentication
 * Requires valid customer JWT (userId). Sets req.user.
 */
exports.authenticateUser = (req, res, next) => {
  const token = extractToken(req, ['gravoz_user_token', 'gravoz_user_refresh_token']);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid user session token.' });
    }
    req.user = decoded;
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
  const token = extractToken(req, [
    'gravoz_user_token',
    'gravoz_user_refresh_token',
    'gravoz_admin_token',
    'gravoz_admin_refresh_token',
  ]);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) {
        if (decoded.userId) req.user = decoded;
        if (decoded.adminId || decoded.role === 'admin' || decoded.role === 'superadmin') {
          req.admin = decoded;
        }
      }
    } catch {
      // Ignored for optional auth
    }
  }
  next();
};

/**
 * 3. Mandatory Admin Authentication
 * Requires valid admin JWT (adminId or role === 'admin' | 'superadmin'). Sets req.admin.
 */
exports.authenticateAdmin = (req, res, next) => {
  const token = extractToken(req, ['gravoz_admin_token', 'gravoz_admin_refresh_token']);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Admin authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const isAdmin = Boolean(
      decoded && (decoded.adminId || decoded.role === 'admin' || decoded.role === 'superadmin')
    );
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
    }
    req.admin = decoded;
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
  const token = extractToken(req, [
    'gravoz_admin_token',
    'gravoz_admin_refresh_token',
    'gravoz_user_token',
    'gravoz_user_refresh_token',
  ]);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Valid customer or admin session required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && (decoded.adminId || decoded.role === 'admin' || decoded.role === 'superadmin')) {
      req.admin = decoded;
      return next();
    }
    if (decoded && decoded.userId) {
      req.user = decoded;
      return next();
    }
    return res.status(401).json({ error: 'Invalid session token payload.' });
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
};
