const auth = require('../auth');
const route = require('express').Router();

route.use('/login', require('./login'));
route.use('/users', auth, require('./users'));
route.use('/requests', require('./request'));
route.use('/reports',require('./report'));

route.get('/', async (req, res) => {
    res.redirect('/login');
});

route.get('/logout', async (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});
  
module.exports = { route }