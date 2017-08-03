'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const cookie = require("cookie");
const identity = require("../lib/controllers/identity");
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

app.get('/', (req, res)=>{
  var DATA = { root: "/" };
  identity.isSignin(req)
    .then((usr)=>{
      DATA.usr = usr;
      return (usr) ? dbop_tree.getFamilyIDByUsr(usr) : Promise.resolve(false);
    })
    .then((result) => {  
      if(result)  DATA.fgUrl = config.fgUrlRoot+result._id;
      return res.render('pages/index', DATA);
     })
    .catch((err) => {
      console.log(err);
      next();
    })
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
        return false;
      })
      .then(()=>{
        res.json({rst});
      });
  }
  else  res.json({rst: 0});
});

app.post("/signin_action", (req, res)=>{
  var usr = req.body.usr;
  var pw = req.body.pw;

  dbop_user.signin(usr, pw)
    .then((rst)=>{
      res.json({rst});
    });
});

app.post("/check_signin", (req, res)=>{
  var token = req.body.token;

  dbop_user.check_token(token)
    .then((usr)=>{
      if(!usr) return res.redirect("/");
      res.setHeader("Set-Cookie", cookie.serialize("LOGIN_INFO", token, {
        httpOnly: true,
        maxAge: dbop_user.survive_time // 1 week
      }));
      res.redirect("/");
    });
});

app.get("/sign_out", function(req, res){
  res.setHeader("Set-Cookie", cookie.serialize("LOGIN_INFO", "", {
    httpOnly: true,
    maxAge: 0.1, // 0.1 second
  }));
  res.redirect("/");
});

// setting page
app.get('/setting', (req, res) => {
  var DATA = { root: "/" };
  identity.isSignin(req)
    .then((usr)=>{
      DATA.usr = usr;
      return (usr) ? dbop_tree.getFamilyIDByUsr(usr) : Promise.resolve(false);
    })
    .then((result) => {  
      if(result)  DATA.fgUrl = config.fgUrlRoot+result._id;
      return res.render('pages/setting', DATA);
     })
    .catch((err) => {
      console.log(err);
      next();
    })
});

// tree router
const tree_route = require('../lib/routes/tree_route');
app.use('/tree', tree_route);

 // popup window router
const PopupWindowAPI = require('../lib/routes/popup');
app.use('/mask', PopupWindowAPI);

// mail group router
const MailGroupAPI = require('../lib/routes/mail-group');
app.use('/fg/:fgid/mail/mg', (req, res, next) => {
  identity.isSignin(req)
    .then((usr)=>{
      if(usr) return next();
      res.redirect("/");  
    });
}, MailGroupAPI);

// mail letter router
const MailLetterAPI = require('../lib/routes/mail-letter');
app.use('/fg/:fgid/mail/ml', (req, res, next)=>{
  identity.isSignin(req)
    .then((usr)=>{
      if(usr) return next();
      res.redirect("/");  
    });
}, MailLetterAPI);

// family group router
const FamilyGroupAPI = require('../lib/routes/family-group');
app.use('/fg/:fgid', (req, res, next) => {
  identity.isSignin(req)
    .then((usr)=>{
      if(usr) return next();
      res.redirect("/");  
    });
}, FamilyGroupAPI);

 // transport router
const TransportAPI = require('../lib/routes/transport');
app.use('/transport', TransportAPI);

// 404
app.use((req,res) => {
  console.log(`[server] cannot find url = ${req.url}`);
  identity.isSignin(req)
    .then((usr)=>res.status(404).render('pages/error.ejs', { code: 404, usr }))
});


const port = process.env.PORT || 5000;

app.listen(port, ()=>{
  console.log("listening on "+port);
});