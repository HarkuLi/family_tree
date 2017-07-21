'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');


const config = {
  appRoot: __dirname, // required config
  domain: "http://familytree.org/fg/",
  qrcodeAPI: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=',
  googleAPIKey: "AIzaSyAhDOrZD0mM1wTRXChGr4v8eDyUp-MuDo0",
  googleShortenUrlAPI: "https://www.googleapis.com/urlshortener/v1/url?key=",
};

app.set('view engine', 'ejs');
app.set('views', './views')        // set views folder
app.use(express.static('public'))  // set static files folder
app.use(bodyParser.json());        // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', function (req, res) {
  res.render('pages/index');
});

app.get('/tree', (req, res) => {
  let data = [
    { text: { name: "First child" } },
    { text: { name: "Second child" } },
    { text: { name: "Third child" } },
    { text: { name: "Four child" } },
  ];

  //ejs.compile('pages/tree', {client: true}); // Use client option
  res.render('pages/tree', {data: JSON.stringify(data)})
});

app.get('/mask/qrcode', function (req, res) {
  let fgid = req.query.fgid;
  let qrcodeUrl = config.qrcodeAPI + config.domain + fgid;
  let shortUrl = '';

  try{
    // check fid format (12 bytes, hex, length = 12 x 2 = 24) 
    const regHex = /[a-fA-F\d]+\b/g;
    if(!fgid){ throw Error("Empty FamilyGroupID Input"); }
    if(!regHex.test(fgid)){ throw Error("Invalid FamilyGroupID Format"); }
    if((fgid.length % 2) !== 0){ throw Error("illegal hex string with odd length"); }
    if(fgid.length !== 24){ throw Error("illegal hex string length, must be 12 bytes"); }

    // shorten url
    request(config.googleShortenUrlAPI + config.googleAPIKey, {
      method: "POST",
      json: true,
      body: { longUrl: qrcodeUrl }
    }, (err, response, body) => {
      if(err) throw Error(err);
      if(!body) throw Error("Receive empty response when shorten url");
      shortUrl = body.id;

      console.log({qrcodeUrl, shortUrl});
      setTimeout(() => {
        res.render('partials/mask/qrcode.ejs', { qrcodeUrl: qrcodeUrl, shortUrl: shortUrl, client: true });
      }, 2000);
    })
  }catch(e){
    console.log(e.message);
    return res.status(400).render('partials/mask/mask-error.ejs', { client: true });
  }
});

app.get('/mask/:page', function (req, res) {
  let path = 'partials/mask/mask-error.ejs';
  console.log(req.params);
  switch(req.params.page){
    case "signin": path = 'partials/mask/signin.ejs'; break;
    case "signup": path = 'partials/mask/signup.ejs'; break;
    case "qrcode": path = 'partials/mask/qrcode.ejs'; break;
    case "detail": path = 'partials/mask/detail.ejs'; break;
  }

  // test
  setTimeout(() => {
    res.render(path, { client: true });
  }, 2000);
});

// 404
app.use(function(req,res){
	res.status(404).render('pages/error.ejs', { code: 404 });
});

// 505
app.use(function(err,req,res,next){
	console.log(err.stack);
	res.status(500).render('pages/error.ejs', { code: 500 });
});

app.listen(10010, function (err) {
  if(err) console.log(err);
  console.log('Server is listening on port 10010!');
});