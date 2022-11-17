const mysql = require("mysql");
const util = require('util');
require('dotenv').config();
const mysqlConnection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: process.env.DATABASE_PORT,
    multipleStatements : true
});
mysqlConnection.connect((err) => {
    if(!err){
        console.log("Connected to Database 'pnm'");
    }
    else{
        console.log(err);
        console.log("Connection to Database Failed");
    }
});
const query = {
    query : util.promisify(mysqlConnection.query).bind(mysqlConnection)
};

module.exports = query;