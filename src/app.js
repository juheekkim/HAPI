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

// 로그아웃 또는 서버 재시작(메모리 세션 초기화) 이후 브라우저 "뒤로가기"를 누르면 서버에 새로
// 요청하지 않고 캐시된 이전 페이지(로그인된 화면)를 그대로 보여주는 문제(bfcache/디스크 캐시)를
// 막는다. express.static이 이미 위에서 정적 자원 요청을 처리하고 끝내므로, 여기 도달하는 요청은
// 전부 세션에 따라 내용이 달라지는 동적 페이지/API 응답이라 캐시하면 안 된다.
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

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

// Inject role-permitted top-nav menus into res.locals.navMenus
const loadNavMenus = require('./middlewares/loadNavMenus');
app.use(loadNavMenus);

// Routes
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const guideRoutes = require('./routes/guide');
const apiReferenceRoutes = require('./routes/apiReference');
const supportRoutes = require('./routes/support');
const adminRoutes = require('./routes/admin');
const chatbotRoutes = require('./routes/chatbot');
const assistantRoutes = require('./routes/assistant');

app.use('/auth', authRoutes);
app.use('/home', homeRoutes);
app.use('/guide', guideRoutes);
app.use('/api-reference', apiReferenceRoutes);
app.use('/support', supportRoutes);
app.use('/admin', adminRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/assistant', assistantRoutes);

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
