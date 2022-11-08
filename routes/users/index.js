const route = require('express').Router()
const connection = require('../../connection');

route.get('/', async (req, res) => {
    req.session.user = {
        username: 1
    }
    const params = {
        queryError: false,
        user_level: 1
    }
    const select_users = `SELECT us.id, us.level, us.designation, us.active, ca.name as category_name, 
        CONCAT(us.first_name, " ", us.last_name, " (", us.emp_no, ")") as name,
        CONCAT(us1.first_name, " ", us1.last_name, " (", us1.emp_no, ")") as created_by FROM user us 
        LEFT JOIN categories ca ON us.category_id = ca.id
        LEFT JOIN user us1 ON us.created_by = us1.id
        WHERE us.level != 1`;
    // const users = await connection.query(`SELECT * FROM user WHERE id != ${req.session.user.username} AND level != 1`);
    const users = await connection.query(select_users);
    params.users = users;
    res.render('users',{params: params});
});

route.get('/activate/:id', async (req, res) => {
    if(req.session.user.level === 1){
        const user_id = req.params.id
        await connection.query(`UPDATE user SET active='1' WHERE id = ?`, [user_id]);
    }
    res.redirect('/users');
});

route.get('/deactivate/:id', async (req, res) => {
    if(req.session.user.level === 1){
        const user_id = req.params.id
        await connection.query(`UPDATE user SET active='0' WHERE id = ?`, [user_id]);
    }
    res.redirect('/users');
});

route.get('/add', async (req, res) => {
    const params = {}
    const categories = await connection.query("SELECT * FROM categories");
    params.categories = categories;
    res.render('addUser',{params: params});
});

route.post('/add', async (req, res) => {
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const emp_no = req.body.emp_no;
    const level = parseInt(req.body.level);
    const category = req.body.category;

    const params = {
        queryError: false,
        fnameError: false,
        lnameError: false,
        empnoError: false,
        levelError: false,
        categoryError: false
    }
    if(first_name && last_name && emp_no && level && ([1,2,5].includes(level) || ([3,4].includes(level) && category))){
        const insert_sql = `INSERT INTO user(emp_no, first_name, last_name, password, password_change, level 
            ${[3,4].includes(level) ? ",category_id" : ""} VALUES (?,?,?,'pass123',1,?${[3,4].includes(level) ? `,${category}` : ""})`;
        connection.query(insert_sql, [emp_no,first_name,last_name,level], (err, result, fields)=>{
            if(err){
                console.log(err);
                params.queryError = true;
                res.render("addUser", {params: params});
            }
            else{
                req.session.editRequest = true;
                res.redirect("/requests");
            }
        });
    }
    else{
        if(!first_name) params.fnameError = true;
        if(!last_name) params.lnameError = true;
        if(!emp_no) params.empnoError = true;
        if(!level || ![1,2,3,4,5].includes(level)) params.levelError = true;
        if(!category && [3,4].includes(level)) params.categoryError = true;        
        res.render("addUser", {params: params});
    }
    res.render('addUsers',{params: params});
});

exports = module.exports = route