'use strict';

const homeController = {
  index(req, res) {
    res.render('home/index', { title: 'Portal', currentMenu: 'home' });
  },
};

module.exports = homeController;
