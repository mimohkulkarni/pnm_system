const auth = require('../auth');
const route = require('express').Router();

route.use('/login', require('./login'));
route.use('/users', auth, require('./users'));
route.use('/requests', auth, require('./request'));
route.use('/reports', auth, require('./report'));
route.use('/meetings', auth, require('./meetings'));

route.get('/', async (req, res) => {
    res.redirect('/login');
});

route.get('/403', async (req, res) => {
    res.render('403');
});

route.get('/logout', async (req, res) => {
    req.session = null;
    res.redirect('/login');
});
  
module.exports = { route }