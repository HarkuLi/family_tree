'use strict';

const express = require('express');
const request = require('request');
const MailLetterController = require('../controllers/mail-letter');
const MailLetterAPI = express.Router();  //  /fg/:fgid/mail/ml  

// [v] 顯示所有信件列表的頁面（信件、草稿）
MailLetterAPI.get('/', (req, res) => {
  let fgid = req.pathParams.fgid;
  let fgUrl = req.pathParams.fgUrl;

  // TODO: check login status
  // TODO: check privilege
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

// [fn] 查詢所有信件
MailLetterAPI.get('/fn/list', (req, res) => {  
  let fgid = req.pathParams.fgid;
  if(!fgid) return res.status(400).send({ status: false, message: "cannot find family group id" });

  MailLetterController
    .getMailList(fgid)
    .then((mailList) => res.send({ status: true, data: mailList }))
    .catch((err) => res.status(400).send({ status: false, message: err }));
});

// [fn] 查詢單一信件內容
MailLetterAPI.get('/fn/:lid', (req, res) => {
  let lid = req.params.lid || null;  
  if(!lid) return res.status(400).send({ status: false, message: "letter id is invalid" });

  MailLetterController
    .getMail(lid)
    .then((mailContent) => res.send({ status: true, data: mailContent }))
    .catch((err) => res.status(400).send({ status: false, message: err }));
});

// [v] 查詢單一信件內容
MailLetterAPI.get('/show/:lid', (req, res) => {
  let fgid = req.pathParams.fgid;
  let fgUrl = req.pathParams.fgUrl;
  let lid = req.params.lid || null;
  if(!lid) return res.status(400).send({ status: false, message: "letter id is invalid" });

  MailLetterController
    .getMail(lid)
    .then((mailContent) => res.render('pages/fg.ejs', { page: "maildisplay", fgUrl, lid, mailContent }))
    .catch((err) => res.status(404).render('pages/error.ejs', { code: 404 }));
});

MailLetterAPI.route('/edit/:lid?')
  // [v] 顯示、新增信件編輯頁面
  .get((req, res) => {
    let fgid = req.pathParams.fgid;
    let fgUrl = req.pathParams.fgUrl;
    let lid = req.params.lid || null;

    if(lid){
      //  有lid -> 顯示信件編輯頁面
      MailLetterController
        .getMail(lid)
        .then((mailContent) => {
          if(!mailContent) mailContent = {};  // for mail not found
          res.render('pages/fg.ejs', { page: "maileditor", fgUrl, lid, mailContent });
        })
        .catch((err) => res.status(400).send({ status: false, message: err }));
    }else{
      // 無lid -> 顯示空白的信件新增頁面（必須status為draft才允許編輯
      res.render('pages/fg.ejs', { page: "maileditor", fgUrl, lid, mailContent: {} });
    }
  })
  // [fn] 顯示、新增信件編輯頁面
  .put((req, res) => {
    let lid = req.params.lid || null;
    let mailContent = req.body;

    //  無lid：新增一封信件
    //  有lid：更新一封信件（必須status為draft才允許更新）
    MailLetterController
      .putMail(lid, req.body)
      .then(() => res.send({ status: true }))
      .catch((err) => res.status(400).send({ status: false, message: err}));
  });

// [fn] 刪除一封信件（只允許status為draft、cancel）
MailLetterAPI.delete('/del/:lid', (req, res) => {
  let lid = req.params.lid || null;
  
  MailLetterController
    .deleteMail(lid)
    .then(() => res.send({ status: true }))
    .catch((err) => res.status(400).send({ status: false, message: err}));
});

module.exports = MailLetterAPI;