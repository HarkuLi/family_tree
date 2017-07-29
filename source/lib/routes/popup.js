'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const identity = require("../controllers/identity");
const dbop_tree = require("../controllers/dbop_tree");
const validate = require('../controllers/validate')
const config = require('../../config/default')

const PopupWindowAPI = express.Router();

// QR Code
PopupWindowAPI.get('/qrcode', (req, res) => {
  let usr = false;
  let shortUrl = '';
  let qrcodeUrl = config.qrcodeAPI + config.domain + "fg/";
  
  identity.isSignin(req)
    .then((result) => {
      if(!result)  return Promise.reject("[mail-letter] no login");
      usr = result;
      return dbop_tree.getFamilyIDByUsr(usr);
    })
    .then((result) => {
      if(!result._id)  return Promise.reject("[mail-letter] cannot find fgid by usr");
      return Promise.resolve(result._id.toHexString());
    })
    .then((fgid) => {
      // check fgid format
      if(!validate.checkIDFormat(fgid)) return Promise.reject('FamilyGroup ID Validate Fail.');
      qrcodeUrl += fgid;
      // shorten url
      request(config.googleShortenUrlAPI + config.googleAPIKey, {
        method: "POST",
        json: true,
        body: { longUrl: qrcodeUrl }
      }, (err, response, body) => {
        if(err) return Promise.reject(err);
        if(!body) return Promise.reject("Receive empty response when shorten url");
        shortUrl = body.id;
        res.render('partials/mask/qrcode.ejs', { qrcodeUrl: qrcodeUrl, shortUrl: shortUrl, client: true });
      })
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(400).render('partials/mask/mask-error.ejs', { client: true });
    });
});

// popup window (signin, signup, detail)
PopupWindowAPI.get('/:page', (req, res) => {
  let path = 'partials/mask/mask-error.ejs';
  switch(req.params.page){
    case "signin": path = 'partials/mask/signin.ejs'; break;
    case "signup": path = 'partials/mask/signup.ejs'; break;
    case "detail": path = 'partials/mask/detail.ejs'; break;
  }
  res.render(path, { client: true });
});

module.exports = PopupWindowAPI;