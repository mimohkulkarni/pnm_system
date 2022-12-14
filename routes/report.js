const route = require('express').Router()
const connection = require('../connection');

const dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

route.get('/', async(req, res) => {
    const params = {
        requests: [],
        user_level: 1
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
    const meeting_id = parseInt(req.body.meeting_id);
    if(meeting_id){
        const meetings = await connection.query("SELECT * FROM meeting");
        params.meetings = meetings;
        // const end_time = new Date(`${req.body.meeting_date} 23:59:59`);
        const requests_query = `SELECT re.id, re.title, re.description, re.created_at, re.closed_at, re.category_id, re.open, 
            us.designation AS created_by, re.approved, re.forwarded, re.prev_meeting,
            us1.designation AS closed_by, me.name as meeting_name,
            us2.designation AS category_set_by, me.id as meeting_id
            FROM request re LEFT JOIN user us ON re.created_by = us.id 
            LEFT JOIN meeting me ON re.meeting_id = me.id 
            LEFT JOIN user us1 ON re.closed_by = us1.id 
            LEFT JOIN user us2 ON re.category_set_by = us2.id 
            WHERE re.meeting_id = ? OR re.prev_meeting = ? OR re.prev_meeting LIKE '%,${meeting_id},%' 
                OR re.prev_meeting LIKE '%,${meeting_id}' OR re.prev_meeting LIKE '${meeting_id},%'`
        // console.log(requests_query);
        connection.query(requests_query, [meeting_id,meeting_id], async (err, result)=>{
            if(err){
                params.queryError = true;
                return res.render("reports", {params: params});
            }
            const categories = await connection.query("SELECT * FROM categories");
            const meetings = await connection.query("SELECT * FROM meeting");
            params.summary = [];
            for (const request of result) {
                const remarks = await connection.query(`SELECT re.created_by, re.created_at, re.remark, us.level, re.meeting_remarks,
                    us.designation as name, us.level,re.created_by
                    FROM remarks re LEFT JOIN user us ON re.created_by = us.id WHERE re.request_id = ?`, [request.id]);
                request.level_2_remarks = remarks.filter(re => parseInt(re.level) === 2);
                // request.level_3_4_remarks = remarks.filter(re => [3,4].includes(parseInt(re.level)));
                // request.level_3_remarks = remarks.filter(re => parseInt(re.level) === 3);
                request.level_4_desig = remarks.length > 0 ? remarks.filter(re => parseInt(re.level) === 4)[0]?.name : null;
                request.level_4_remarks = remarks.filter(re => parseInt(re.level) === 4);
                request.meeting_remarks = remarks.filter(re => parseInt(re.level) === 1);
                request.prev_meeting = request.prev_meeting ? String(request.prev_meeting).split(",").map(pme => meetings.find(me => me.id == pme).name) : [request.meeting_name];
                request.category_ids = request.category_id ? String(request.category_id).split(",").map(c => parseInt(c)) : [];
                request.category_names = request.category_id ? String(request.category_id).split(",").map(c => categories.find(ca => ca.id == c).name) : [];
                request.created_at = new Date(request.created_at).toLocaleDateString('en-us',dateOptions);
                request.closed_at = request.closed_at ? new Date(request.created_at).toLocaleDateString('en-us',dateOptions) : null;
                request.status = request.open === 0 ? "Closed" : request.category_ids.length > 0 && request.approved ? "Sent to Departmental Review" : request.category_ids.length > 0 && !request.approved ? "Sent for Department Approval" : "Open";
                if(request.category_id){
                    request.category_id.split(",").forEach(c => {
                        const cat_index = params.summary.findIndex(ca => ca.id == c);
                        const item = {
                            id: request.id,
                            open: request.open === 1,
                            close: request.open === 0,
                            new: request.prev_meeting.length === 1,
                            pertained: request.prev_meeting.length > 1
                        }
                        if(cat_index > -1) params.summary[cat_index].item_numbers.push(item);
                        else params.summary.push({id: c, category_name: categories.find(ca => ca.id == c).name, item_numbers: [item]});
                    });
                }
                params.requests.push(request);
            };
            return res.render("reports", {params: params});
        });
    }
    else{
        params.dateError = true
        const meetings = await connection.query("SELECT * FROM meeting");
        params.meetings = meetings;
        res.render('reports', {params: params});
    }
});

exports = module.exports = route