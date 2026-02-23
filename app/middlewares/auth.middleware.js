// middlewares/auth.middleware.js

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Acesso não autorizado. Faça login primeiro.',
  });
}

module.exports = { requireAuth };
