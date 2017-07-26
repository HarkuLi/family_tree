'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const MailGroupAPI = express.Router();

// [v] 顯示一個mail group區塊 for 拉到底自動載入
MailGroupAPI.get(['/:mgid', '/'], (req, res) => {
  let fgUrl = req.pathParams.fgUrl;
  // check login status

  // check privilege

  // get data from db

  // render
  res.render('pages/fg.ejs', { page: "mailgroup" , fgUrl});
});

// [v][fn] 新增、修改mail group
MailGroupAPI.route('/edit/:mgid')
  .get((req, res) => {  
    // [v] 有mgid -> 修改個別mail group的popup頁面
    //     無mgid -> 新增mail group的popup頁面
  })
  .put((req, res) => {
    // [fn] 有mgid -> 更新mail group設定
    //      無mgid -> 新增一個mail group
  });

// [fn] 刪除一個mail group
MailGroupAPI.delete('/del/:mgid', (req, res) => {});

// [fn] 查詢一個mail group包含的email address
MailGroupAPI.get('/:mgid/adl', (req, res) => {});

// [v][fn] 新增一筆email
MailGroupAPI.route('/:mgid/adl/add')
  .get((req, res) => {
    // [v] 在mail group新增一個email的popup頁面
  })
  .put((req, res) => {
    // [fn] 在mail group中新增一個email address
  });

// [fn] 從mail group中移除一個email address
MailGroupAPI.get('/:mgid/adl/del/:ad', (req, res) => {});

module.exports = MailGroupAPI;