const route = require('express').Router()
const bodyParser = require('body-parser');
const connection = require('../../connection');

route.get('/', async (req, res) => {
    res.render('login');
});

route.post("/", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    const params = {
        usernameError: false,
        passwordError: false,
        loginError: false
    }
    
    if(username && password){
        const login_query = `SELECT id,level FROM user WHERE emp_no = ? AND password = ?`;
        connection.query(login_query, [username,password], (err, result, fields) => {
            if(err || result.length !== 1){
                params.loginError = true;
                return res.render('login',{params:params});
            }
            req.session.user = {
                username: parseInt(result[0].id),
                level: parseInt(result[0].level)
            }
            return res.redirect("/requests");
        })
    }
});

exports = module.exports = route