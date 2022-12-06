const route = require('express').Router()
const bodyParser = require('body-parser');
const connection = require('../connection');

route.get('/', async (req, res) => {
    const params = {
        password_change: false,
        id: null
    }
    if(req.session.password_change){
        params.password_change = true;
        params.id = req.session.user_id;
        req.session.password_change = false;
        req.session.id = null;
    }
    res.render('login', {params: params});
});

route.post("/", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    const params = {
        usernameError: false,
        passwordError: false,
        loginError: false,
        password_change: false,
        queryError: false
    }
    
    if(username && password){
        const login_query = `SELECT id, level, category_id, union_id, active FROM user WHERE emp_no = ? AND password = ?`;
        connection.query(login_query, [username,password], (err, result, fields) => {
            if(err || result.length !== 1 || (result.length === 1 && result[0].active == 0)){
                params.loginError = true;
                return res.render('login',{params:params});
            }
            req.session.user = {
                username: parseInt(result[0].id),
                level: parseInt(result[0].level),
                category_id: parseInt(result[0].category_id),
                union_id: parseInt(result[0].union_id)
            }
            if(result[0].password_change){
                req.session.password_change = true;
                req.session.user_id = result[0].id;
                return res.redirect("/login");
            } 
            return res.redirect("/requests");
        })
    }
    else{
        if(!username) params.usernameError = true
        if(!password) params.passwordError = true
        return res.render('login',{params:params});
    }
});

route.post("/changePassword", (req,res) => {
    const id = req.body.id;
    const password = req.body.password;

    const params = {
        id: id,
        queryError: false
    }
    
    if(id && password){
        const login_query = `UPDATE user SET password = ?, password_change = ? WHERE id = ?`;
        connection.query(login_query, [password, 0, id], (err, result) => {
            if(err){
                params.queryError = true;
                return res.render('login',{params:params});
            }
            return res.redirect("/requests");
        })
    }
    else{
        params.passwordError = true
        return res.render('login',{params:params});
    }
});

exports = module.exports = route