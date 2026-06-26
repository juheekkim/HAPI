'use strict';

const guideController = {
  index(req, res) {
    res.render('guide/index', { title: '시작하기', currentMenu: 'guide' });
  },
};

module.exports = guideController;
