const route = require('express').Router()
const connection = require('../connection');

route.get('/', async (req, res) => {
    const params = {
        queryError: false,
        user_level: req.session.user.level
    }
    const select_users = `SELECT us.id, us.level, us.designation, us.active, ca.name as category_name, 
        CONCAT(us.first_name, " ", us.last_name, " (", us.designation, ")") as name,
        CONCAT(us1.first_name, " ", us1.last_name, " (", us1.designation, ")") as created_by FROM user us 
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
    const designation = req.body.designation;
    const mob_no = req.body.mob_no;
    const level = parseInt(req.body.level);
    const union_id = parseInt(req.body.union);
    const category = parseInt(req.body.category);

    const params = {
        queryError: false,
        fnameError: false,
        lnameError: false,
        desigError: false,
        empnoError: false,
        mobnoError: false,
        levelError: false,
        unionError: false,
        uniqueError: false,
        categoryError: false,
        first_name: first_name,
        last_name: last_name,
        designation: designation,
        emp_no: emp_no,
        mob_no: mob_no,
        level: level,
        union_id: union_id,
        category: category
    }
    
    if(first_name && last_name && emp_no && mob_no && mob_no.length === 10 && level && designation &&
        ([1,2,5].includes(level) || ([3,4].includes(level) && category)) && (level !== 5 || (level === 5 && union_id !== 0))){
        const user_exists = await connection.query("SELECT emp_no, mobile_no FROM user WHERE emp_no = ? OR mobile_no = ?",[emp_no,mob_no]);
        if(user_exists.length > 0 && (user_exists[0].emp_no || user_exists[0].mob_no)){
            params.uniqueError = true;
            const categories = await connection.query("SELECT * FROM categories");
            params.categories = categories;
            return res.render("addUser", {params: params});
        }
        const insert_sql = `INSERT INTO user(emp_no, first_name, last_name, mobile_no, password, password_change, level, designation, created_by
            ${[3,4].includes(level) ? ",category_id" : ""}${level === 5 ? ",union_id" : ""}${level === 1 ? ",active" : ""}) 
            VALUES (?,?,?,?,'pass123',1,?,?,?${[3,4].includes(level) ? `,${category}` : ""}${level === 5 ? `,${union_id}` : ""}${level === 1 ? ",1" : ""})`;
        connection.query(insert_sql, [emp_no, first_name, last_name, mob_no, level, designation, req.session.user.username], async (err, result)=>{
            if(err){
                console.log(err);
                params.queryError = true;
                const categories = await connection.query("SELECT * FROM categories");
                params.categories = categories;
                res.render("addUser", {params: params});
            }
            else{
                req.session.editRequest = true;
                res.redirect("/users");
            }
        });
    }
    else{
        if(!first_name) params.fnameError = true;
        if(!last_name) params.lnameError = true;
        if(!emp_no) params.empnoError = true;
        if(!designation) params.desigError = true;
        if(!mob_no || mob_no.length !== 10) params.mobnoError = true;
        if(!level || ![1,2,3,4,5].includes(level)) params.levelError = true;
        if(!union_id || ![1,2].includes(union_id) || level === 5 && union_id !== 0) params.unionError = true;
        if(!category && [3,4].includes(level)) params.categoryError = true;
        const categories = await connection.query("SELECT * FROM categories");
        params.categories = categories;    
        res.render("addUser", {params: params});
    }
});

route.get('/edit/:id', async (req, res) => {
    let params = {
        id: req.params.id,
        userError: false,
        queryError: false
    }
    if(params.id){
        const select_sql = `SELECT emp_no, first_name, last_name, mobile_no as mob_no, level, designation, category_id, union_id FROM user WHERE id = ?`
        connection.query(select_sql, [params.id], async (err, result)=>{
            if(err){
                params.userError = true;
                res.render('addUser',{params: params});
            }
            const categories = await connection.query("SELECT * FROM categories");
            params = {
                ...params,
                ...result[0],
                categories: categories,
            }
            res.render("addUser", {params: params});
        });
    }
    else{
        params.userError = true;
        res.render('addUser',{params: params});
    }
});

route.post('/edit/:id', async (req, res) => {
    const id = parseInt(req.body.id);
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const emp_no = req.body.emp_no;
    const designation = req.body.designation;
    const mob_no = req.body.mob_no;
    const level = parseInt(req.body.level);
    const union_id = parseInt(req.body.union);
    const category = req.body.category;

    const params = {
        id: id,
        queryError: false,
        fnameError: false,
        lnameError: false,
        desigError: false,
        empnoError: false,
        mobnoError: false,
        levelError: false,
        unionError: false,
        categoryError: false,
        first_name: first_name,
        last_name: last_name,
        designation: designation,
        emp_no: emp_no,
        mob_no: mob_no,
        level: level,
        union_id: union_id,
        category: category
    }
    if(id && first_name && last_name && emp_no && mob_no && mob_no.length === 10 && level && designation &&
        ([1,2,5].includes(level) || ([3,4].includes(level) && category)) && (level !== 5 || (level === 5 && union_id !== 0))){
        const update_sql = `UPDATE user SET emp_no = ?, first_name = ?, last_name = ?, mobile_no = ?, password_change = ?, level = ? 
            ${[3,4].includes(level) ? `, category_id = ${category}` : ""}${level === 5 ? `, union_id = ${union_id}` : ""} WHERE id = ?`;
        connection.query(update_sql, [emp_no,first_name,last_name, mob_no, 1, level, id], async (err, result)=>{
            if(err){
                console.log(err);
                params.queryError = true;
                const categories = await connection.query("SELECT * FROM categories");
                params.categories = categories;
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
        if(!designation) params.desigError = true;
        if(!mob_no || mob_no.length !== 10) params.mobnoError = true;
        if(!level || ![1,2,3,4,5].includes(level)) params.levelError = true;
        if(!union_id || ![1,2].includes(union_id) || level === 5 && union_id !== 0) params.unionError = true;
        if(!category && [3,4].includes(level)) params.categoryError = true;
        const categories = await connection.query("SELECT * FROM categories");
        params.categories = categories;    
        res.render("addUser", {params: params});
    }
});

exports = module.exports = route