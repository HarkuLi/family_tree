'use strict';

const express = require('express');
const request = require('request');
const FamilyGroupController = require('../controllers/family-group');
const FamilyGroupAPI = express.Router();

// TAG: [v] family group index
FamilyGroupAPI.get('/', (req, res) => {
  let fgUrl = req.url;
  res.render('pages/fg', { page: null });
});

// TAG: [fn] 查詢family group所有人的email清單
FamilyGroupAPI.get('/adl', (req, res) => {
  
  let fgid = req.pathParams.fgid;
  if(!fgid) return res.status(400).send({ status: false, message: "cannot find family group id" });

  FamilyGroupController
    .getAllMemberEmails(fgid)
    .then((emails) => res.send({ status: true, data: emails }))
    .catch((err) => res.status(400).send({ status: false, message: err }));
});

module.exports = FamilyGroupAPI;