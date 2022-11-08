const mysql = require("mysql");
const util = require('util');
const mysqlConnection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "pnm",
    multipleStatements : true
});
mysqlConnection.connect((err) => {
    if(!err){
        console.log("Connected to Database 'pnm'");
    }
    else{
        console.log("Connection to Database Failed");
    }
});
const query = {
    query : util.promisify(mysqlConnection.query).bind(mysqlConnection)
};

module.exports = query;