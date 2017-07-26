'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const dbop_user = require("../lib/controllers/dbop_user");
const dbop_tree = require("../lib/controllers/dbop_tree");

const app = express();

/*  config  */
const config = require('../config/default');

app.set('view engine', 'ejs');
app.set('views', './views')        // set views folder
app.use(express.static(path.resolve(__dirname, "../../public")))  // set static files folder
app.use(bodyParser.json());        // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', function (req, res) {
  res.render('pages/index', { root: "/" });
});

app.post("/signup_action", (req, res)=>{
  var name = req.body.name;
  var usr = req.body.usr;
  var pw = req.body.pw;
  var rst;

  if(name && usr && pw){
    dbop_user.getUserByName(usr)
      .then((userData)=>{
        if(userData) return 0;
        return dbop_user.newUser({
          usr,
          pw
        });
      })
      .then((new_user_rst)=>{
        rst = new_user_rst;
        if(new_user_rst)  return dbop_tree.newFamily({name, usr});
        return 0;
      })
      .then(()=>{
        res.json({rst});
      });
  }
  else  res.json({rst: 0});
});

// setting page
app.get('/setting', (req, res) => {});

// tree router
const tree_route = require('../lib/routes/tree_route');
app.use('/tree', tree_route);

 // popup window router
const PopupWindowAPI = require('../lib/routes/popup');
app.use('/mask', (req, res, next) => {
  req.pathParams = req.params; 
  req.pathParams.fgUrl = req.originalUrl.split('/').splice(0,3).join('/');
  next();
}, PopupWindowAPI);

// mail group router
const MailGroupAPI = require('../lib/routes/mail-group');
app.use('/fg/:fgid/mail/mg', (req, res, next) => {
  req.pathParams = req.params; 
  req.pathParams.fgUrl = req.originalUrl.split('/').splice(0,3).join('/');
  next();
}, MailGroupAPI);

// mail letter router
const MailLetterAPI = require('../lib/routes/mail-letter');
app.use('/fg/:fgid/mail/ml', (req, res, next) => {
  req.pathParams = req.params;
  req.pathParams.fgUrl = req.originalUrl.split('/').splice(0,3).join('/');
  next();
}, MailLetterAPI);

// family group router
const FamilyGroupAPI = require('../lib/routes/family-group');
app.use('/fg/:fgid', (req, res, next) => {
  req.pathParams = req.params; 
  req.pathParams.fgUrl = req.originalUrl.split('/').splice(0,3).join('/');
  next();
}, FamilyGroupAPI);

// 404
app.use((req,res) => res.status(404).render('pages/error.ejs', { code: 404 }));

app.listen(10010, function (err) {
  if(err) console.log(err);
  console.log('Server is listening on port 10010!');
});