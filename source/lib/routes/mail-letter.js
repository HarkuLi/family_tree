'use strict';

const express = require('express');
const request = require('request');
const MailLetterController = require('../controllers/mail-letter');
const identity = require("../controllers/identity");
const dbop_tree = require("../controllers/dbop_tree");
const config = require('../../config/default');
const MailLetterAPI = express.Router();  //  /fg/:fgid/mail/ml  

// TAG: check login
MailLetterAPI.use((req, res, next)=>{
  identity.isSignin(req)
    .then((usr)=>{
      if(usr) return next();
      res.redirect("/");  //please signin
    });
});

// TAG: [v] 顯示所有信件列表的頁面（信件、草稿）
MailLetterAPI.get('/', (req, res) => {
  var usr = false;
  var fgUrl = config.fgUrlRoot;

  // check login status
  identity.isSignin(req)
    .then((result) => {
      if(!result)  return Promise.reject("[mail-letter] no login");
      usr = result;
      return dbop_tree.getFamilyIDByUsr(usr);
    })
    .then((fgid) => {
      if(!fgid)  return Promise.reject("[mail-letter] cannot find fgid by usr");
      fgUrl += fgid;

      // TODO: check privilege
      return MailLetterController.getMailList(fgid);
    })
    .then((list) => res.render('pages/fg.ejs', { page: "mailletter", list, fgUrl }))
    .catch((err) => {
      console.log(err);
      res.status(404).render('pages/error.ejs', { code: 404 });
    });
});

// TAG: [fn] 查詢所有信件
MailLetterAPI.get('/fn/list', (req, res) => {  
  identity.isSignin(req)
    .then((usr) => {
      if(!usr)  return Promise.reject("[mail-letter] no login");
      return dbop_tree.getFamilyIDByUsr(usr);
    })
    .then((fgid) => {
      if(!fgid) return Promise.reject("[mail-letter] cannot find family group id");
      return MailLetterController.getMailList(fgid);
    })
    .then((mailList) => res.send({ status: true, data: mailList }))
    .catch((err) => res.status(400).send({ status: false, message: err }));
});

// TAG: [fn] 查詢單一信件內容
MailLetterAPI.get('/fn/:lid', (req, res) => {
  let lid = req.params.lid || null;  
  if(!lid) return res.status(400).send({ status: false, message: "letter id is invalid" });
  
  identity.isSignin(req)
    .then((usr) => {
      if(!usr)  return Promise.reject("[mail-letter] no login");
      return dbop_tree.getFamilyIDByUsr(usr);
    })
    .then((fgid) => {
      if(!fgid) return Promise.reject("[mail-letter] cannot find family group id");
      return MailLetterController.getMail(lid);
    })
    .then((mailContent) => res.send({ status: true, data: mailContent }))
    .catch((err) => res.status(400).send({ status: false, message: err }));
});

// TAG: [v] 查詢單一信件內容
MailLetterAPI.get('/show/:lid', (req, res) => {
  let fgUrl = config.fgUrlRoot;
  let lid = req.params.lid || null;
  if(!lid) return res.status(400).send({ status: false, message: "letter id is invalid" });
  
  identity.isSignin(req)
    .then((usr) => {
      if(!usr)  return Promise.reject("[mail-letter] no login");
      return dbop_tree.getFamilyIDByUsr(usr);
    })
    .then((fgid) => {
      if(!fgid) return Promise.reject("[mail-letter] cannot find family group id");
      fgUrl += fgid;
      return MailLetterController.getMail(lid);
    })
    .then((mailContent) => res.render('pages/fg.ejs', { page: "maileditor", fgUrl, lid, mailContent, editable: false }))
    .catch((err) => res.status(404).render('pages/error.ejs', { code: 404 }));
});

MailLetterAPI.route('/edit/:lid?')
  // TAG: [v] 顯示、新增信件編輯頁面
  .get((req, res) => {
    let fgUrl = config.fgUrlRoot;
    let lid = req.params.lid || null;
    
    identity.isSignin(req)
      .then((usr) => {
        if(!usr)  return Promise.reject("[mail-letter] no login");
        return dbop_tree.getFamilyIDByUsr(usr);
      })
      .then((fgid) => {
        if(!fgid) return Promise.reject("[mail-letter] cannot find family group id");
        fgUrl += fgid;

        // 無lid -> 顯示空白的信件新增頁面（必須status為draft才允許編輯
        if(!lid){
          res.render('pages/fg.ejs', { page: "maileditor", fgUrl, lid, mailContent: {}, editable: true });
          return Promise.resolve('bypass');
        }
        return MailLetterController.getMail(lid);
      })
      .then((mailContent) => {
        // no lid and bypass this step
        if(mailContent === 'bypass') return;  
        if(lid && !mailContent) return Promise.reject(`[mail-letter] mail not found with lid = ${lid}`);
        // for mail not found
        if(!mailContent) mailContent = {};  
        //  有lid -> 顯示信件編輯頁面
        res.render('pages/fg.ejs', { page: "maileditor", fgUrl, lid, mailContent, editable: true });
      })
      .catch((err) => res.status(400).send({ status: false, message: err }));
  })
  // TAG: [fn] 顯示、新增信件編輯頁面
  .put((req, res) => {
    let lid = req.params.lid || null;
    let mailContent = req.body;
    //  無lid：新增一封信件
    //  有lid：更新一封信件（必須status為draft才允許更新）
    identity.isSignin(req)
      .then((usr) => {
        if(!usr) return Promise.reject("not signin now");
        let mailContent = MailLetterController.putMail(lid, req.body);
        return Promise.all([usr, mailContent]);
      })
      .then((result) => {
        //console.log(result);
        let usr = result[0];
        let mailContent = result[1];
        // use 'user1' for test
        return MailLetterController.sendMail(usr, lid, mailContent);
      })
      .then(() => res.send({ status: true }))
      .catch((err) => res.status(400).send({ status: false, message: err}));
  });

// TAG: [fn] 刪除一封信件（只允許status為draft、cancel）
MailLetterAPI.delete('/del/:lid', (req, res) => {
  let lid = req.params.lid || null;
  
  identity.isSignin(req)
    .then((usr) => {
      if(!usr) return Promise.reject("not signin now");
      return MailLetterController.deleteMail(lid);
    })
    .then(() => res.send({ status: true }))
    .catch((err) => res.status(400).send({ status: false, message: err}));
});

module.exports = MailLetterAPI;