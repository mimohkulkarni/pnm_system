const route = require('express').Router()
const fileUpload = require('express-fileupload');
const connection = require('../connection');
const path = require('path');

const dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

route.get('/', async (req, res) => {
    const params = {
        add: false,
        edit: false,
        delete: false,
        user_level: req.session?.user?.level
    }
    // console.log(requests_query);
    if(req.session.addRequest){
        params.add = true;
        req.session.addRequest = false;
    }
    if(req.session.editRequest){
        params.edit = true;
        req.session.editRequest = false;
    }
    if(req.session.deleteRequest){
        params.delete = true;
        req.session.deleteRequest = false;
    }
    if(req.session.limitError){
        params.limitError = true;
        req.session.limitError = false;
    }
    return res.render('requests', {params: params});
});


route.get("/getAllRequests", async (req, res) => {
    const params = {
        requests: [],
        limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    const user_level = req.session.user.level;
    const requests_query = `SELECT re.id, re.title,re.description, re.created_at, re.category_id, re.approved, re.open, re.prev_meeting,
            re.union_id, CONCAT(us.first_name, " ", us.last_name, " (", us.designation, ")") AS created_by, re.meeting_id 
            FROM request re LEFT JOIN user us ON re.created_by = us.id 
            WHERE 
            ${[3,4].includes(user_level) 
            ? `re.category_id= '${req.session.user.category_id}' OR re.category_id LIKE '%,${req.session.user.category_id},%' 
                OR re.category_id LIKE '%,${req.session.user.category_id}' OR re.category_id LIKE '${req.session.user.category_id},%' 
                AND re.approved = 1 
                ${user_level === 3 
                ? `AND re.forwarded = 0` 
                : `AND (re.forwarded = 1 OR re.sent_to = '${req.session.user.username}' OR 
                    re.sent_to LIKE '%,${req.session.user.username},%' OR re.sent_to LIKE '%,${req.session.user.username}' 
                    OR re.sent_to LIKE '${req.session.user.username},%')`
                }` 
            : user_level === 5 
                ? `re.union_id = ${req.session.user.union_id}` 
                : "1"}
             ORDER BY re.id ASC LIMIT 0,${params.limit}`
    // console.log(requests_query);
    const curr_date = new Date();
    const meetings = await connection.query("SELECT * FROM meeting");
    // params.meetings = meetings.filter(me => me.meeting_date > curr_date);
    params.meetings = [...meetings];
    if([1,2].includes(user_level)){
        const categories = await connection.query("SELECT * FROM categories");
        params.categories = categories;
    }
    const requests = await connection.query(requests_query);
    if(requests && requests.length > 0){
        for(const request of requests){
            const count = await connection.query("SELECT count(*) as level_4_remarks FROM `remarks` re JOIN user us ON re.created_by = us.id WHERE re.`request_id` = ? AND us.level = ?",[request.id,4]);
            request.level_4_remarks = count[0]?.level_4_remarks ? count[0].level_4_remarks : 0;
            request.created_at = new Date(request.created_at).toLocaleDateString('en-us',dateOptions);
            request.closed_at = request.closed_at ? new Date(request.closed_at).toLocaleDateString('en-us',dateOptions) : null;
            request.category_id = request.category_id ? String(request.category_id).split(",").map(c => parseInt(c)) : [];
            request.status = request.open === 0 ? "Closed" : request.level_4_remarks > 0 ? "Marked For Closer" : request.category_id.length > 0 && request.approved ? "Sent to Departmental Review" : request.category_id.length > 0 && !request.approved ? "Sent for Department Approval" : "Open";
            const meeting = meetings.find(me => me.id === request.meeting_id);
            if(new Date(meeting.meeting_date) < curr_date && request.open){
                let new_meeting_id = meetings.find(me => new Date(me.meeting_date) > curr_date && meeting.union_id == request.union_id)?.id;
                if(new_meeting_id){
                    let prev_meeting_ids = [new_meeting_id];
                    if(request.prev_meeting){
                        const prev_meeting_id_array = String(request.prev_meeting).split(",");
                        if(!prev_meeting_id_array.includes(String(new_meeting_id)) && new_meeting_id !== request.meeting_id)
                            prev_meeting_id_array.push(new_meeting_id);
                        prev_meeting_ids = prev_meeting_id_array;
                    }
                    await connection.query("UPDATE `request` SET `meeting_id` = ?, prev_meeting = ? WHERE `id` = ? AND `open` = ?",[new_meeting_id,prev_meeting_ids.join(","),request.id,1]);
                    request.meeting_id = new_meeting_id;
                } 
            }
            params.requests.push(request);
        };
        // console.log(params);
    }
    return res.end(JSON.stringify(params));
});

route.get("/add", async (req, res) => {
    const meetings = await connection.query("SELECT id, name, meeting_date FROM meeting WHERE meeting_date >= now() AND union_id = ?",[req.session.user.union_id]);
    res.render("addRequest", {params: {meetings: meetings}});
});

route.post("/add", fileUpload({createParentPath: true}), async (req, res) => {
    const title = req.body.title;
    const desc = req.body.description;
    const meeting = parseInt(req.body.meeting);
    const file = req.files ? req.files.file : null;

    const params = {
        titleError: false,
        descError: false,
        meetingError: false,
        queryError: false,
        title: title,
        desc: desc
    }

    if(title && desc && meeting){
        const requests_nos = await connection.query("SELECT count(*) as request_nos FROM request WHERE meeting_id = ?",[meeting]);
        if(requests_nos[0]["request_nos"] >= 30){
            req.session.limitError = true;
            return res.redirect("/requests")
        } 
        let filePath = null;
        if(file){
            const filename = file.name.replace(/\s+/g, "_").replace(/\s+/g, "_").split(".");
            filePath = path.join("public","files", `${filename[0]}${new Date().getTime()}.${filename[1]}`);
            file.mv(filePath, err => {
                if(err) res.redirect("/requests/add");
            });
        }
        const insert_sql = `INSERT INTO request(title, description, meeting_id, union_id, created_by, created_at 
            ${file ? ", filepath" : ""}) VALUES (?,?,?,?,?,now()
            ${file ? `,${JSON.stringify(filePath.replace("public\\",""))}` : ""})`;
        connection.query(insert_sql, [title, desc, meeting, req.session.user.union_id, req.session.user.username], async (err, result)=>{
            if(err){
                console.log(err);
                params.queryError = true;
                res.end(JSON.stringify(params));
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
        if(!desc) params.descError = true;
        res.end(JSON.stringify(params));
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
    const select_sql = "SELECT `id`, `title`, `description`, `meeting_id`, `filepath` FROM `request` WHERE `id` = ?";
    connection.query(select_sql, [req_id], async (err, result)=>{
        if(err){
            params.queryError = true;
            return res.render("addRequest", {params: params});
        }
        const meetings = await connection.query("SELECT * FROM meeting WHERE meeting_date >= now() AND union_id = ?",[req.session.user.union_id]);
        params.id = parseInt(req_id);        
        params.filetype = result[0].filepath ? path.extname(result[0].filepath) : null,
        params.title = result[0].title;
        params.desc = result[0].description;
        params.meeting_id = result[0].meeting_id;
        params.filepath = result[0].filepath.replace("public\\","").replace("public/","");
        params.meetings = meetings;
        return res.render("addRequest", {params: params});
    });
});

route.post("/edit/:id", fileUpload({createParentPath: true}), async (req, res) => {
    const id = req.body.id;
    const title = req.body.title;
    const desc = req.body.description;
    const meeting_id = parseInt(req.body.meeting);
    const file = req.files ? req.files.file : null;

    const params = {
        titleError: false,
        descError: false,
        queryError: false,
        meetingError: false,
        title: title,
        desc: desc,
        meeting_id: meeting_id,
        id: id
    }

    if(id && title && desc && meeting_id && meeting_id > 0){
        let filePath = null;
        if(file){
            const filename = file.name.replace(/\s+/g, "_").replace(/\s+/g, "_").split(".");
            filePath = path.join("public","files", `${filename[0]}${new Date().getTime()}.${filename[1]}`);
            file.mv(filePath, err => {
                if(err) res.redirect("/requests");
            });
        }
        const update_sql = `UPDATE request SET title= ?, description= ?, meeting_id = ?${file ? `,filepath = ${JSON.stringify(filePath.replace("public\\",""))}` : ""} WHERE id = ?`;
        connection.query(update_sql, [title, desc, meeting_id, id], async (err, result)=>{
            if(err){
                // console.log(err);
                const meetings = await connection.query("SELECT * FROM meeting WHERE meeting_date >= now() AND union_id = ?",[req.session.user.union_id]);
                params.meetings = meetings;
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
        if(!meeting_id || meeting_id <= 0) params.meetingError = true;
        else params.descError = true;
        const meetings = await connection.query("SELECT * FROM meeting WHERE meeting_date >= now() AND union_id = ?",[req.session.user.union_id]);
        params.meetings = meetings;
        res.render("addRequest", {params: params});
    }
});

route.get("/delete/:id", async(req, res) => {
    const id = req.params.id;

    if(id){
        const delete_sql = "DELETE FROM `request` WHERE `id` = ?";
        await connection.query(delete_sql, [id]);
        req.session.deleteRequest = true;
        return res.redirect("/requests");
    }
    else res.redirect("/requests");
});

route.get('/view/:id', (req, res) => {

    let params = {
        queryError: false,
        closed: false,
        user_level: req.session.user.level,
        sent_to: []
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
        re.sent_to as sent_user, re.filepath, re.freeze, re.approved, re.forwarded, me.id as meeting_id, re.union_id,
        CONCAT(us.first_name, " ", us.last_name, " (", us.designation, ")") AS created_by,
        ${params.user_level === 5 ? 'us1.designation' : 'CONCAT(us1.first_name, " ", us1.last_name, " (", us1.designation, ")")'} AS closed_by,
        ${params.user_level === 5 ? 'us2.designation' : 'CONCAT(us2.first_name, " ", us2.last_name, " (", us2.designation, ")")'} AS category_set_by,
        me.meeting_date AS meeting_date, me.name as meeting_name 
        FROM request re LEFT JOIN user us ON re.created_by = us.id
        LEFT JOIN meeting me ON re.meeting_id = me.id 
        LEFT JOIN user us1 ON re.closed_by = us1.id 
        LEFT JOIN user us2 ON re.category_set_by = us2.id WHERE re.id = ?`;
    connection.query(select_sql, [req_id], async (err, result)=>{
        if(err || !result[0]){
            // console.log(err);
            params.queryError = true;
            return res.render("viewRequest", {params: params});
        }
        if(result[0].approved && !result[0].open){
            params.closed = true;
            // return res.render("viewRequest", {params: params});
        }
        const sent_user = result[0].sent_user ? result[0].sent_user.split(",") : [];
        const category_ids = result[0].category_id ? String(result[0].category_id).split(",").map(c => parseInt(c)) : [];
        if(sent_user.length > 0){
            for (const cat of category_ids) {
                const users = await connection.query(`SELECT id, CONCAT(first_name, " ", last_name, " (", designation, ")") AS name
                    FROM user WHERE category_id = ?`, [cat])
                users.forEach(user => {
                    if(sent_user.includes(String(user.id))) user.selected = true;
                    params.sent_to.push(user);
                });
            }
            // for (const user_id of sent_user) {
            //     const user = await connection.query(`SELECT id, CONCAT(first_name, " ", last_name, " (", designation, ")") AS name
            //         FROM user WHERE id = ?`, [user_id])
            //     params.sent_to.push(user[0]);
            // }
        }
        const remarks = await connection.query(`SELECT re.id, re.created_by, re.created_at, re.remark, us.level, re.meeting_remarks,
            CONCAT(us.first_name, " ", us.last_name, " (", us.designation, ")") as name, us.level AS remarked_by
            FROM remarks re LEFT JOIN user us ON re.created_by = us.id WHERE re.request_id = ? ORDER BY re.created_at ASC`, [req_id])
        const categories = await connection.query("SELECT * FROM categories");
        if(params.user_level === 1){
            const meetings = await connection.query("SELECT id, name FROM meeting WHERE meeting_date > now() AND union_id = ?",[result[0].union_id]);
            params.meetings = meetings.filter(me => me.id !== result[0].meeting_id);
        }
        params = {
            ...params,
            ...result[0],
            created_at : new Date(result[0].created_at).toLocaleDateString('en-us',dateOptions),
            closed_at: result[0].closed_at ? new Date(result[0].closed_at).toLocaleDateString('en-us',dateOptions) : null,
            categories: categories,
            filepath: result[0].filepath ? result[0].filepath.split(",").map(fp => fp.replace("public\\","").replace("public/","")) : [],
            filetype: result[0].filepath ? result[0].filepath.split(",").map(fp => path.extname(fp)) : [],
            level_2_remarks: remarks.filter(re => parseInt(re.level) === 2),
            level_3_4_remarks: remarks.filter(re => [3,4].includes(parseInt(re.level))),
            // level_3_remarks: remarks.filter(re => parseInt(re.level) === 3),
            level_4_remarks: remarks.filter(re => parseInt(re.level) === 4),
            meeting_remarks: remarks.filter(re => parseInt(re.level) === 4),
            meeting_remarks: remarks.filter(re => re.meeting_remarks),
            category_ids: category_ids,
            category_names: result[0].category_id ? category_ids.map(c => categories.find(ca => ca.id == c).name) : [],
            user_level: req.session.user.level,
            meeting_date: result[0].meeting_date
        }
        params.status = params.open === 0 ? "Closed" : params.level_4_remarks.length > 0 ? "Marked For Closer" : params.category_ids.length > 0 && params.approved ? "Sent to Departmental Review" : params.category_ids.length > 0 && !params.approved ? "Sent for Department Approval" : "Open";
        // console.log(params.filetype);
        return res.render("viewRequest", {params: params});
    });
});

route.get("/getCategoryUsers",async (req, res) => {
    const ids = req.query.id ? req.query.id.split(",") : [];
    if(ids.length > 0){
        const users = [];
        for (const id of ids) {
            const update_sql = `SELECT id, CONCAT(first_name, " ", last_name, " (", designation, ")") as name FROM user WHERE category_id = ?`;
            const users_res = await connection.query(update_sql, [ id ]);
            if(users_res && users_res.length > 0) users_res.forEach(user => users.push(user));
        }
        res.end(JSON.stringify(users));
    }
});

route.post("/setCategory",(req, res) => {
    const id = req.body.id;
    const category_ids = req.body.categories ? req.body.categories.split(",") : [];
    const user_ids = req.body.users ? req.body.users.split(",") : [];
    if(id && category_ids.length > 0 && user_ids.length > 0){
        const update_sql = "UPDATE `request` SET `category_id` = ?, `category_set_by` = ?, `sent_to` = ? WHERE `id` = ?"
        // connection.query(update_sql, [category_id, req.session?.user?.username, id], (err, result, fields) => {
        connection.query(update_sql, [category_ids.join(","), 1, user_ids.join(","), id], (err, result) => {
            if(!err) req.session.editRequest = true;
            else req.session.queryError = true;
        });
        res.redirect("/requests");
    }
});

route.post("/setApproval",async (req, res) => {
    const id = req.body.id;
    const category_ids = req.body.categories ? req.body.categories.split(",") : [];
    const user_ids = req.body.users ? req.body.users.split(",") : [];
    const remarks = req.body.remarks;
    const approval = parseInt(req.body.approval);
    if(id && category_ids.length > 0 && user_ids.length > 0){
        const update_sql = `UPDATE request SET category_id = ?, category_set_by = ?, sent_to = ?, approved = ? WHERE id = ?`;
        await connection.query(update_sql, [category_ids.join(","), req.session.user.username, user_ids.join(","), approval === 1 || approval !== 3 ? 0 : 1, id], 
            async (err, result) => {
            if(err){
                req.session.queryError = true;
                return res.redirect("/requests");
            } 
            req.session.editRequest = true;
            if(remarks){
                const insert_sql = `INSERT INTO remarks(request_id, created_by, created_at, remark) VALUES (?,?,now(),?)`;
                await connection.query(insert_sql, [id, req.session.user.username, remarks ? remarks : ""])
            }
            return res.redirect("/requests");
        });
    }
    else return res.redirect("/viewRequest/"+id);
});

route.post("/addRemarks", async (req, res) => {
    const id = req.body.id;
    const remarks = req.body.remarks;
    if(id && remarks){
        const update_sql = `UPDATE request SET forwarded = ? WHERE id = ?`;
        await connection.query(update_sql, [0, id], async (err, result) => {
            if(err) {
                req.session.queryError = true;
                return res.redirect("/requests");
            }
            const insert_sql = `INSERT INTO remarks(request_id, created_by, created_at, remark) VALUES (?,?,now(),?)`;
            await connection.query(insert_sql, [id, req.session.user.username, remarks], (err, result) => {
                // console.log(err);
                if(err) req.session.queryError = true;
                else req.session.editRequest = true;
                return res.redirect("/requests");
            });
        });
    }
    else return res.redirect("/requests");
});

route.post("/editOSRemarks", async (req, res) => {
    const id = req.body.id;
    const remarks = req.body.remarks;
    if(id && remarks){
        const update_sql = `UPDATE remarks SET remark = ? WHERE id = ?`;
        await connection.query(update_sql, [remarks, id], async (err, result) => {
            if(err) {
                req.session.queryError = true;
                return res.end(JSON.stringify({error: true}));
            }
            return res.end(JSON.stringify({error: false}));
        });
    }
    else res.end(JSON.stringify({error: true}));
});

route.post("/forward", fileUpload({createParentPath: true}), async (req, res) => {
    const id = req.body.id;
    const forward = parseInt(req.body.forward);
    const remarks = req.body.remarks;
    const file = req.files ? req.files.file : null;

    if(id && remarks && [0,1].includes(forward)){
        let filePath = null;
        let arr = [];
        if(file){
            const filename = file.name.replace(/\s+/g, "_").replace(/\s+/g, "_").split(".");
            filePath = path.join("public","files", `${filename[0]}${new Date().getTime()}.${filename[1]}`);
            file.mv(filePath, err => {
                if(err) return res.redirect("/requests/add");
            });
            const prePath = await connection.query("SELECT filepath FROM request WHERE id = ?",[id]);
            if(prePath[0]?.filepath){
                arr = prePath[0].filepath.split(",");
            }
            arr.push(filePath);
        }
        const update_sql = `UPDATE request SET forwarded = ?${file ? `, filepath = '${arr.join(",").replace(/\\/g,"\\\\")}'` : ""} WHERE id = ?`;
        await connection.query(update_sql, [0, id], async (err, result) => {
            // console.log(err);
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
    const id = parseInt(req.body.id);
    const remarks = req.body.remarks;
    if(id && remarks){
        const update_sql = `UPDATE request SET open = ?, closed_by = ?, closed_at = now() WHERE id = ?`;
        await connection.query(update_sql, [0, req.session.user.username, id], async (err, result) => {
            if(err) {
                req.session.queryError = true;
                return res.redirect("/requests");
            }
            const insert_sql = `INSERT INTO remarks(request_id, meeting_remarks, created_by, created_at, remark) VALUES (?,?,?,now(),?)`;
            await connection.query(insert_sql, [id, 1, req.session.user.username, remarks], (err, result) => {
                // console.log(err);
                if(err) req.session.queryError = true;
                else req.session.editRequest = true;
                return res.redirect("/requests");
            });
        });
    }
    else return res.redirect("/requests");
});

route.post("/freeze", async (req, res) => {
    const id = req.body.id;
    const freeze = parseInt(req.body.freeze);
    if(id && [0,1].includes(freeze)){
        const update_sql = `UPDATE request SET freeze = ? WHERE id = ?`;
        await connection.query(update_sql, [freeze, id], async (err, result) => {
            console.log(err);
            if(err) req.session.queryError = true;
            else req.session.editRequest = true;
            return res.redirect("/requests");
        });
    }
    else return res.redirect("/requests");
});

route.post("/forwardToNextMeeting", async (req, res) => {
    const meeting_id = req.body.meeting_id;
    const curr_meeting_id = req.body.curr_meeting_id;
    const req_id = req.body.id;
    
    if(meeting_id && req_id && curr_meeting_id){
        const check_prev_meeting_ids = await connection.query(`SELECT prev_meeting FROM request WHERE id = ?`,[req_id]);
        let prev_meeting_ids = [curr_meeting_id];
        if(check_prev_meeting_ids[0].prev_meeting){
            const prev_meeting_id_array = String(check_prev_meeting_ids[0].prev_meeting).split(",");
            if(!prev_meeting_id_array.includes(String(curr_meeting_id))) 
                prev_meeting_id_array.push(curr_meeting_id);
            prev_meeting_ids = prev_meeting_id_array;
        }
        const insert_sql = `UPDATE request SET meeting_id = ?, prev_meeting = ? WHERE id = ?`;
        await connection.query(insert_sql, [meeting_id, prev_meeting_ids.join(","), req_id], async (err, result) => {
            // console.log(err);
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

route.post("/forwardToAdmin", async (req, res) => {
    const req_id = req.body.id;
    
    if(req_id){
        const insert_sql = `UPDATE request SET approved = ? WHERE id = ?`;
        await connection.query(insert_sql, [0, req_id], async (err, result) => {
            // console.log(err);
            if(err) req.session.queryError = true;
            res.redirect("/requests");
        });
    }
    else{
        req.session.queryError = true;
        return res.redirect("/requests");
    } 
});

exports = module.exports = route