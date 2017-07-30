'use strict';

const express = require('express');
const request = require('request');
const identity = require("../controllers/identity");
const FamilyGroupController = require('../controllers/family-group');
const FamilyGroupAPI = express.Router();

// TAG: [v] family group index
FamilyGroupAPI.get('/', (req, res) => {
  let fgUrl = req.url;
  res.render('pages/fg', { page: null });
});

// TAG: [fn] 查詢family group所有人的email清單
FamilyGroupAPI.get('/adl', (req, res) => {
  var usr = false;
  let getUsr = identity.isSignin(req).then((usr) => usr);
  let getFGID = identity.getFamilyID(req).then((fgid) => fgid);
  
  Promise.all([getUsr, getFGID])
    .then((result) => {
      // check login status & get fgid
      if(!result[0])  return Promise.reject("[family-group] no login");
      if(!result[1])  return Promise.reject("[family-group] cannot find fgid by usr");
      let fgid = result[1];
      return FamilyGroupController.getAllMemberEmails(fgid);
    })
    .then((emaillist) => res.send({ status: true, data: emaillist }))
    .catch((err) => res.status(400).send({ status: false, message: err }));
});

module.exports = FamilyGroupAPI;