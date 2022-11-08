const route = require('express').Router()
const connection = require('../connection');

route.get('/', async(req, res) => {
    const params = {
        requests: []
    }
    const meetings = await connection.query("SELECT * FROM meeting");
    params.meetings = meetings;
    res.render('reports', {params: params});
});

route.post('/', async (req, res) => {
    const params = {
        requests: [],
        dateError: false,
        user_level: 1
    }
    const meeting_id = req.body.meeting_id;
    if(meeting_id){
        const meetings = await connection.query("SELECT * FROM meeting");
        params.meetings = meetings;
        // const end_time = new Date(`${req.body.meeting_date} 23:59:59`);
        const requests_query = `SELECT re.id, re.title, re.description, re.created_at, re.closed_at, re.category_id, re.open, 
            CONCAT(us.first_name, " ", us.last_name, " (", us.emp_no, ")") AS created_by, re.approved, re.forwarded, 
            CONCAT(us1.first_name, " ", us1.last_name, " (", us.emp_no, ")") AS closed_by, 
            CONCAT(us2.first_name, " ", us2.last_name, " (", us.emp_no, ")") AS category_set_by 
            FROM request re LEFT JOIN user us ON re.created_by = us.id 
            LEFT JOIN meeting me ON re.meeting_id = me.id 
            LEFT JOIN user us1 ON re.closed_by = us1.id 
            LEFT JOIN user us2 ON re.category_set_by = us2.id 
            WHERE re.meeting_id = ?`
        // console.log(requests_query);
        connection.query(requests_query, [meeting_id], async (err, result)=>{
            if(err){
                params.queryError = true;
                return res.render("reports", {params: params});
            }
            const categories = await connection.query("SELECT * FROM categories");
            for (const request of result) {
                const remarks = await connection.query(`SELECT re.created_by, re.created_at, re.remark, us.level,
                    CONCAT(us.first_name, " ", us.last_name, " (", us.emp_no, ")"), us.level AS remarked_by
                    FROM remarks re LEFT JOIN user us ON re.created_by = us.id WHERE re.request_id = ?`, [request.id]);
                request.level_2_remarks = remarks.filter(re => parseInt(re.level) === 2);
                request.level_3_remarks = remarks.filter(re => parseInt(re.level) === 3);
                request.level_4_remarks = remarks.filter(re => parseInt(re.level) === 4);                
                request.category_ids = request.category_id ? String(request.category_id).split(",").map(c => parseInt(c)) : [];
                request.category_names = request.category_id ? String(request.category_id).split(",").map(c => categories.find(ca => ca.id == c).name) : [];
                request.created_at = new Date(request.created_at).toLocaleDateString() + " " + new Date(request.created_at).toLocaleTimeString();
                params.requests.push(request);
            };
            console.log(params);
            return res.render("reports", {params: params});
        });
    }
    else{
        params.dateError = true
        res.render('reports', {params: params});
    }
});

exports = module.exports = route