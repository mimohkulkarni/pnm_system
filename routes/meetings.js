const route = require('express').Router()
const connection = require('../connection');

route.get('/', async(req, res) => {
    const params = {
        meetings: [],
        user_level: req.session.user.level
    }
    await connection.query(`SELECT me.id, me.name, me.meeting_date, me.union_id,
        CONCAT(us.first_name, " ", us.last_name, " (", us.designation, ")") as created_by 
        FROM meeting me LEFT JOIN user us ON me.created_by = us.id`, async (err, result) => {
        if(err){
            params.queryError = true;
            res.render("meetings", {params: params});
        }
        for (const meeting of result) {
            const assigned_requests = await connection.query(`SELECT count(*) as count FROM request WHERE meeting_id = ?`,[meeting.id]);
            meeting.assigned_requests = assigned_requests[0].count;
            meeting.meeting_date = new Date(meeting.meeting_date).toLocaleDateString() + " " + new Date(meeting.meeting_date).toLocaleTimeString();
            params.meetings.push(meeting);
        };
        // console.log(params);
        res.render('meetings', {params: params});
    });
});

route.post("/createMeeting", async (req, res) => {
    const meeting_date = new Date(req.body.meeting_date);
    const meeting_name = req.body.meeting_name;
    const union_id = req.body.union_id;
    if(meeting_date && meeting_name && union_id){
        const insert_sql = `INSERT INTO meeting (meeting_date, name, created_at, created_by) VALUES (?, ?, now(), ?)`;
        await connection.query(insert_sql, [meeting_date, meeting_name, 1], async (err, result) => {
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