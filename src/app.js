'use strict';

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'hapi-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Inject session user into res.locals for all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const guideRoutes = require('./routes/guide');
const apiReferenceRoutes = require('./routes/apiReference');
const supportRoutes = require('./routes/support');
const adminRoutes = require('./routes/admin');

app.use('/auth', authRoutes);
app.use('/home', homeRoutes);
app.use('/guide', guideRoutes);
app.use('/api-reference', apiReferenceRoutes);
app.use('/support', supportRoutes);
app.use('/admin', adminRoutes);

// Root redirect
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/home');
  res.redirect('/auth/login');
});

// 404
app.use((req, res) => {
  res.status(404).render('error/404', { title: '페이지 없음', currentMenu: '' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).render('error/500', { title: '서버 오류', currentMenu: '' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HAPI Portal → http://localhost:${PORT}`);
});

module.exports = app;
