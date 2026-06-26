'use strict';

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') return next();
  res.status(403).render('error/403', { title: '접근 권한 없음', currentMenu: '' });
}

module.exports = isAdmin;
