const route = require('express').Router()
const bodyParser = require('body-parser');
const connection = require('../../connection');
const urlencodedParser = bodyParser.urlencoded({extended: false});

route.get('/', async (req, res) => {
    const params = {
        requests: [],
        add: false,
        edit: false,
        meeting: false,
        user_level: 5
    }
    const requests_query = `SELECT re.id, re.title,re.description, re.created_at, re.category_id, re.approved,
            CONCAT(us.first_name, " ", us.last_name, " (", us.emp_no, ")") AS created_by 
            FROM request re LEFT JOIN user us ON re.created_by = us.id 
            WHERE re.open = 1 ${[3,4].includes(params.user_level) ? `AND re.category_id= '${1}' OR re.category_id LIKE '%,${1},%' 
                OR re.category_id LIKE '%,${1}' OR re.category_id LIKE '${1},%' AND re.approved = 1 ${params.user_level === 3 ? `AND re.forwarded = 0` : "AND re.forwarded = 1"}` : 
                params.user_level === 2 ? "AND re.approved = 0" : params.user_level === 5 ? "AND re.approved = 0" : ""}`;
    // console.log(requests_query);
    if(req.session.addRequest){
        add = true;
        req.session.addRequest = false;
    }
    if(req.session.editRequest){
        edit = true;
        req.session.editRequest = false;
    }
    if(req.session.meetingRequest){
        meeting = true;
        req.session.meetingRequest = false;
    }
    if([1,2].includes(params.user_level)){
        const categories = await connection.query("SELECT * FROM categories");
        params.categories = categories;
    }
    connection.query(requests_query,(err, result)=>{
        if(err) return res.render("requests", {params: params});
        result.forEach(request => {
            request.created_at = new Date(request.created_at).toLocaleDateString() + " " + new Date(request.created_at).toLocaleTimeString()
            request.category_id = request.category_id ? String(request.category_id).split(",").map(c => parseInt(c)) : [];
            request.status = request.open === 0 ? "Closed" : request.category_id.length > 0 && request.approved ? "Sent to Departmental Review" : request.category_id.length > 0 && !request.approved ? "Sent for Department Approval" : "Open"
            params.requests.push(request);
        });
        return res.render('requests', {params: params});
    });
});

route.get("/add", async (req, res) => {
    const curr_date = new Date();
    const meetings = await connection.query("SELECT id, name, meeting_date FROM meeting WHERE meeting_date >= ?",[curr_date.toLocaleDateString()]);
    console.log(meetings);
    res.render("addRequest", {params: {meetings: meetings}});
});

route.post("/add", urlencodedParser, (req, res) => {
    const title = req.body.title;
    const desc = req.body.description;
    const meeting = req.body.meeting;

    const params = {
        titleError: false,
        descError: false,
        meetingError: false,
        queryError: false,
        title: title,
        desc: desc
    }

    if(title && desc && meeting){
        const insert_sql = "INSERT INTO `request`(`title`, `description`, `meeting_id`, `created_by`, `created_at`) VALUES (?,?,?,?,now())";
        connection.query(insert_sql, [title, desc, meeting, 1], (err, result, fields)=>{
            if(err){
                console.log(err);
                params.queryError = true;
                res.render("addRequest", {params: params});
            }
            else{
                req.session.addRequest = true;
                res.redirect("/requests");
            }
        });
    }
    else{
        if(!title) params.titleError = true;
        if(!meeting) params.meetingError = true;
        else params.descError = true;
        
        res.render("addRequest", {params: params});
    }
});

route.get('/edit/:id', (req, res) => {

    const params = {
        titleError: false,
        descError: false,
        queryError: false,
        title: "",
        desc: ""
    }

    const req_id = req.params.id;
    const select_sql = "SELECT `id`, `title`, `description` FROM `request` WHERE `id` = ?";
    connection.query(select_sql, [req_id], (err, result, fields)=>{
        if(err){
            params.queryError = true;
            return res.render("addRequest", {params: params});
        }
        params.id = parseInt(req_id);
        params.title = result[0].title;
        params.desc = result[0].description;
        return res.render("addRequest", {params: params});
    });
});

route.post("/edit", urlencodedParser, (req, res) => {
    const id = req.body.id;
    const title = req.body.title;
    const desc = req.body.description;

    const params = {
        titleError: false,
        descError: false,
        queryError: false,
        title: title,
        desc: desc,
        id: id
    }

    if(title && desc){
        const update_sql = "UPDATE `request` SET `title`=?, `description`=? WHERE `id` = ?";
        connection.query(update_sql, [title, desc, id], (err, result, fields)=>{
            if(err){
                console.log(err);
                params.queryError = true;
                res.render("addRequest", {params: params});
            }
            else{
                req.session.editRequest = true;
                res.redirect("/requests");
            }
        });
    }
    else{
        if(!title) params.titleError = true;
        else params.descError = true;
        
        res.render("addRequest", {params: params});
    }
});

route.get("/delete/:id", async(req, res) => {
    const id = req.params.id;

    if(id){
        const delete_sql = "DELETE FROM `request` WHERE `id` = ?";
        await connection.query(delete_sql, [id])
        return res.redirect("/requests");
    }
    else res.redirect("/requests");
});

route.get('/view/:id', (req, res) => {

    let params = {
        queryError: false,
        closed: false,
        user_level: 1
    }

    if(req.session.queryError){
        params.queryError = true;
        req.session.queryError = false;
    }
    if(req.session.remarksError){
        params.remarksError = true;
        req.session.remarksError = false;
    }

    const req_id = req.params.id;
    const select_sql = `SELECT re.id, re.title, re.description, re.created_at, re.closed_at, re.category_id, re.open,
        CONCAT(us.first_name, " ", us.last_name, " (", us.emp_no, ")") AS created_by, re.approved, re.forwarded,
        CONCAT(us1.first_name, " ", us1.last_name, " (", us.emp_no, ")") AS closed_by, me.name as meeting_name,
        CONCAT(us2.first_name, " ", us2.last_name, " (", us.emp_no, ")") AS category_set_by, me.id as meeting_id
        FROM request re LEFT JOIN user us ON re.created_by = us.id
        LEFT JOIN meeting me ON re.meeting_id = me.id 
        LEFT JOIN user us1 ON re.closed_by = us1.id 
        LEFT JOIN user us2 ON re.category_set_by = us2.id WHERE re.id = ?`;
    connection.query(select_sql, [req_id], async (err, result)=>{
        if(err || !result){
            console.log(err);
            params.queryError = true;
            return res.render("viewRequest", {params: params});
        }
        if(result[0].approved && !result[0].open){
            params.closed = true;
            // return res.render("viewRequest", {params: params});
        }
        const remarks = await connection.query(`SELECT re.created_by, re.created_at, re.remark, us.level,
            CONCAT(us.first_name, " ", us.last_name, " (", us.emp_no, ")"), us.level AS remarked_by
            FROM remarks re LEFT JOIN user us ON re.created_by = us.id WHERE re.request_id = ?`, [req_id])
        const categories = await connection.query("SELECT * FROM categories");        
        if(params.user_level === 1){
            const meetings = await connection.query("SELECT id, name FROM meeting");
            params.meetings = meetings.filter(me => me.id !== result[0].meeting_id);
        }
        params = {
            ...params,
            ...result[0],
            created_at : new Date(result[0].created_at).toLocaleDateString() + " " + new Date(result[0].created_at).toLocaleTimeString(),
            categories: categories,
            level_2_remarks: remarks.filter(re => parseInt(re.level) === 2),
            level_3_remarks: remarks.filter(re => parseInt(re.level) === 3),
            level_4_remarks: remarks.filter(re => parseInt(re.level) === 4),
            category_ids: result[0].category_id ? String(result[0].category_id).split(",").map(c => parseInt(c)) : [],
            category_names: result[0].category_id ? String(result[0].category_id).split(",").map(c => categories.find(ca => ca.id == c).name) : [],
            user_level: 1
        }
        console.log(params);
        return res.render("viewRequest", {params: params});
    });
});

route.post("/setCategory",(req, res) => {
    const ids = JSON.parse(req.body.ids);
    const category_ids = JSON.parse(req.body.categories);
    if(ids.length > 0 && category_ids.length > 0){
        ids.forEach((id,i) => {
            const update_sql = "UPDATE `request` SET `category_id` = ?, `category_set_by` = ? WHERE `id` = ?"
            // connection.query(update_sql, [category_id, req.session?.user?.username, id], (err, result, fields) => {
            connection.query(update_sql, [category_ids[i].join(","), 1, id], (err, result) => {
                if(!err) req.session.editRequest = true;
                else req.session.queryError = true;
            });    
        });
        res.redirect("/requests");
    }
});

route.post("/setApproval",async (req, res) => {
    const ids = JSON.parse(req.body.ids);
    const category_ids = JSON.parse(req.body.categories);
    const remarks = req.body.remarks;
    const approval = parseInt(req.body.approval);
    if(ids.length > 0 && category_ids.length > 0 && req.session.user.level === 2){
        ids.forEach(async (id,i) => {
            const update_sql = `UPDATE request SET category_id = ?, category_set_by = ?, approved = ? WHERE id = ?`;
            await connection.query(update_sql, [category_ids[i].join(","), req.session.user.username, approval === 1 || approval !== 3 ? 0 : 1, id], (err, result) => {
                if(!err) req.session.editRequest = true;
                else req.session.queryError = true;
            });
        });
        if(remarks){
            const insert_sql = `INSERT INTO remarks(request_id, created_by, created_at, remark) VALUES (?,?,now(),?)`;
            const remark_res = await connection.query(insert_sql, [ids[0], req.session.user.username, remarks ? remarks : ""])
            console.log(remark_res);
        }
        res.redirect("/requests");
    }
    else return res.redirect("/requests");
});

route.post("/addRemarks", async (req, res) => {
    const id = req.body.id;
    const remarks = req.body.remarks;
    if(id && remarks){
        const update_sql = `UPDATE request SET forwarded = ? WHERE id = ?`;
        await connection.query(update_sql, [0, id], async (err, result) => {
            console.log(err);
            if(err) {
                req.session.queryError = true;
                return res.redirect("/requests");
            }
            const insert_sql = `INSERT INTO remarks(request_id, created_by, created_at, remark) VALUES (?,?,now(),?)`;
            await connection.query(insert_sql, [id, req.session.user.username, remarks], (err, result) => {
                console.log(err);
                if(err) req.session.queryError = true;
                else req.session.editRequest = true;
                return res.redirect("/requests");
            });
        });
    }
    else return res.redirect("/requests");
});

route.post("/forward", async (req, res) => {
    const id = req.body.id;
    const remarks = req.body.remarks;
    if(id && remarks){        
        const update_sql = `UPDATE request SET forwarded = ? WHERE id = ?`;
        await connection.query(update_sql, [1, id], async (err, result) => {
            if(err) {
                req.session.queryError = true;
                return res.redirect("/requests");
            }
            const insert_sql = `INSERT INTO remarks(request_id, created_by, created_at, remark) VALUES (?,?,now(),?)`;
            await connection.query(insert_sql, [id, req.session.user.username, remarks], (err, result) => {
                if(err) req.session.queryError = true;
                else req.session.editRequest = true;
                res.redirect("/requests");
            });
        });
    }
    else{
        req.session.remarkError = true;
        return res.redirect("/requests/view/"+id);
    } 
});

route.post("/close", async (req, res) => {
    const id = req.body.id;
    if(id){        
        const update_sql = `UPDATE request SET open = ?, closed_by = ?, closed_at = now() WHERE id = ?`;
        await connection.query(update_sql, [0, req.session.user.username, id], async (err, result) => {
            if(err) req.session.queryError = true;
            else req.session.editRequest = true;
            res.redirect("/requests");
        });
    }
    else return res.redirect("/requests");
});

route.post("/createMeeting", async (req, res) => {
    const meeting_date = new Date(req.body.meeting_date);
    const meeting_name = req.body.meeting_name;
    if(meeting_date && meeting_name){
        const insert_sql = `INSERT INTO meeting (meeting_date, name, created_at, created_by) VALUES (?, ?, now(), ?)`;
        await connection.query(insert_sql, [meeting_date, meeting_name, 1], async (err, result) => {
            console.log(err);
            if(err) req.session.queryError = true;
            else req.session.meetingRequest = true;
            res.redirect("/requests");
        });
    }
    else{
        req.session.queryError = true;
        return res.redirect("/requests");
    } 
});

route.post("/forwardToNextMeeting", async (req, res) => {
    const meeting_id = req.body.meeting_id;
    const req_id = req.body.req_id;
    if(meeting_id && req_id){
        const insert_sql = `UPDATE request SET meeting_id = ? WHERE id = ?`;
        await connection.query(insert_sql, [meeting_id, req_id], async (err, result) => {
            console.log(err);
            if(err) req.session.queryError = true;
            else req.session.meetingRequest = true;
            res.redirect("/requests");
        });
    }
    else{
        req.session.queryError = true;
        return res.redirect("/requests");
    } 
});

exports = module.exports = route