const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.use('/',require('./routes').route);
app.use((req,res) =>{
    res.status(404).render('404');
});

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log('Server Started on port 3000');
});