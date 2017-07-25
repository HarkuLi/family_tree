'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const PopupWindowAPI = express.Router();

// QR Code
PopupWindowAPI.get('/qrcode', (req, res) => {
  let fgid = req.query.fgid;
  let qrcodeUrl = config.qrcodeAPI + config.domain + "/fg" + fgid;
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

// popup window (signin, signup, detail)
PopupWindowAPI.get('/:page', (req, res) => {
  let path = 'partials/mask/mask-error.ejs';
  console.log(req.params);
  switch(req.params.page){
    case "signin": path = 'partials/mask/signin.ejs'; break;
    case "signup": path = 'partials/mask/signup.ejs'; break;
    case "detail": path = 'partials/mask/detail.ejs'; break;
  }

  setTimeout(() => {
    res.render(path, { client: true });
  }, 2000);
});

module.exports = PopupWindowAPI;