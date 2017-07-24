'use strict';

const express = require('express');
const request = require('request');
const FamilyGroupAPI = express.Router();

// [v] family group index
FamilyGroupAPI.get('/', (req, res) => {
  let fgUrl = req.url;
  res.render('pages/fg-dashboard.ejs', { client: true, fgUrl: fgUrl });
});

// [fn] 查詢family group所有人的email清單
FamilyGroupAPI.get('/adl', (req, res) => {});

module.exports = FamilyGroupAPI;