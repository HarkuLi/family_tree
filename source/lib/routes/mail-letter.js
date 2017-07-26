'use strict';

const express = require('express');
const request = require('request');
const MailLetterController = require('../controllers/mail-letter');
const MailLetterAPI = express.Router();  //  /fg/:fgid/mail/ml  

// [v] 顯示所有信件列表的頁面（信件、草稿）
MailLetterAPI.get('/', (req, res) => {
  let fgid = req.pathParams.fgid;
  let fgUrl = req.pathParams.fgUrl;

  // check login status


  // check privilege


  // get data from db
  MailLetterController.getMailList(fgid)
    .then((list) => {
      // render
      res.render('pages/fg.ejs', { page: "mailletter", list, fgUrl });
    })
    .catch((err) => {
      console.log(err);
      res.status(404).render('pages/error.ejs', { code: 404 });
    });
});

// [fn] 查詢所有信件 (也許可以用filter篩選）
MailLetterAPI.get('/sl', (req, res) => {  
  // query filter
});

// [v] 查詢單一信件內容
MailLetterAPI.delete('/:lid', (req, res) => {

});

// [v] 顯示、新增信件編輯頁面
MailLetterAPI.route('/edit/(:lid)?')
  .get((req, res) => {
    //  [v] 有lid -> 顯示信件編輯頁面
    //      無lid -> 顯示空白的信件新增頁面（必須status為draft才允許編輯
    let fgid = req.pathParams.fgid;
    let fgUrl = req.pathParams.fgUrl;
    let mid = req.pathParams.mid || null;
    res.render('pages/fg.ejs', { page: "maileditor", fgUrl, mid });
  })
  .put((req, res) => {
    //  [fn] 無lid：新增一封信件
    //       有lid：更新一封信件（必須status為draft才允許更新）
  });

// [fn] 刪除一封信件（只允許status為draft、cancel）
MailLetterAPI.delete('/del/:lid', (req, res) => {

});

module.exports = MailLetterAPI;