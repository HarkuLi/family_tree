'use strict';

const express = require('express');
const MailLetterController = require('../controllers/mail-letter');
const identity = require("../controllers/identity");
const dbop_tree = require("../controllers/dbop_tree");
const MailGroup = require("../controllers/mail-group");
const FamilyGroup = require("../controllers/family-group");
const config = require('../../config/default');
const MailLetterAPI = express.Router();  //  /fg/:fgid/mail/ml  

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
    .then((result) => {
      if(!result._id)  return Promise.reject("[mail-letter] cannot find fgid by usr");
      let fgid = result._id.toHexString();
      fgUrl += fgid;
      return MailLetterController.getMailList(fgid);
    })
    .then((list) => res.render('pages/fg.ejs', { page: "mailletter", list, fgUrl, usr }))
    .catch((err) => {
      console.log(err);
      res.status(404).render('pages/error.ejs', { code: 404, usr });
    });
});

// TAG: [fn] 查詢所有信件
MailLetterAPI.get('/fn/list', (req, res) => {  
  identity.isSignin(req)
    .then((usr) => {
      if(!usr)  return Promise.reject("[mail-letter] no login");
      return dbop_tree.getFamilyIDByUsr(usr);
    })
    .then((result) => {
      if(!result._id) return Promise.reject("[mail-letter] cannot find family group id");
      let fgid = result._id.toHexString();
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
    .then((result) => {
      if(!result._id) return Promise.reject("[mail-letter] cannot find family group id");
      return MailLetterController.getMail(lid);
    })
    .then((mailContent) => res.send({ status: true, data: mailContent }))
    .catch((err) => res.status(400).send({ status: false, message: err }));
});

// TAG: [v] 查詢單一信件內容
MailLetterAPI.get('/show/:lid', (req, res) => {
  let fgUrl = config.fgUrlRoot;
  let lid = req.params.lid || null;
  let usr = false;
  let e_mg_list = [];
  if(!lid) return res.status(400).send({ status: false, message: "letter id is invalid" });
  
  identity.isSignin(req)
    .then((usr) => {
      if(!usr)  return Promise.reject("[mail-letter] no login");
      return dbop_tree.getFamilyIDByUsr(usr);
    })
    .then((result) => {
      if(!result._id) return Promise.reject("[mail-letter] cannot find family group id");
      let fgid = result._id.toHexString();
      fgUrl += fgid
      return Promise.all([ FamilyGroup.getAllMemberEmails(fgid), MailGroup.getGroupList(fgid) ]);
    })
    .then((result) => {
      // process email group dropdown list
      let emaillist = result[0];
      let grouplist = result[1];
      grouplist.forEach((group) => {
        let tmp = {type: "group", context: "", id: group._id};
        tmp.context = `"${group.name}" [group:${group._id}]`;
        e_mg_list.push(tmp);
      })
      emaillist.forEach((member) => {
        let tmp = {type: "email", context: "", id: member.pid};
        tmp.context = `"${member.name}" <${member.email}>`;
        e_mg_list.push(tmp);
      });
      return MailLetterController.getMail(lid);
    })
    .then((mailContent) => res.render('pages/fg.ejs', { page: "maileditor", usr, fgUrl, lid, mailContent, editable: false, e_mg_list }))
    .catch((err) => res.status(404).render('pages/error.ejs', { code: 404 }));
});

MailLetterAPI.route('/edit/:lid?')
  // TAG: [v] 顯示、新增信件編輯頁面
  .get((req, res) => {
    let fgUrl = config.fgUrlRoot;
    let usr = false;
    let lid = req.params.lid || null;
    let e_mg_list = [];
    
    identity.isSignin(req)
      .then((res) => {
        if(!res)  return Promise.reject("[mail-letter] no login");
        usr = res;
        return dbop_tree.getFamilyIDByUsr(res);
      })
      .then((result) => {
        if(!result) return Promise.reject("[mail-letter] cannot find family group id");
        let fgid = result._id.toHexString();
        fgUrl += fgid;
        console.log(fgid);
        return Promise.all([ FamilyGroup.getAllMemberEmails(fgid), MailGroup.getGroupList(fgid) ]);
      })
      .then((result) => {
        // process email group dropdown list
        let emaillist = result[0];
        let grouplist = result[1];
        grouplist.forEach((group) => {
          let tmp = {type: "group", context: "", id: group._id};
          tmp.context = `"${group.name}" [group:${group._id}]`;
          e_mg_list.push(tmp);
        })
        emaillist.forEach((member) => {
          let tmp = {type: "email", context: "", id: member.pid};
          tmp.context = `"${member.name}" <${member.email}>`;
          e_mg_list.push(tmp);
        });

        // 無lid -> 顯示空白的信件新增頁面（必須status為draft才允許編輯
        if(!lid){
          res.render('pages/fg.ejs', { page: "maileditor", usr, fgUrl, lid, mailContent: {}, editable: true, e_mg_list });
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
        res.render('pages/fg.ejs', { page: "maileditor", usr, fgUrl, lid, mailContent, editable: true, e_mg_list });
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
        // process putmail data
        let modifiedData = {
          usr: usr,
          from: usr,
          to: req.body.to,
          cc: req.body.cc,
          bcc: req.body.bcc,
          subject: req.body.subject,
          context: req.body.context,
          reserveTime: req.body.reserveTime,
          autoSend: req.body.autoSend
        };
        
        modifiedData.fgid = req.body.fgUrl.substr(4);
        modifiedData.status = (req.body.autoSend) ? "pending" : "draft";
        modifiedData.tags = (req.body.autoSend) ? ["auto-send"] : [];

        console.log(modifiedData);
        let mailContent = MailLetterController.putMail(usr, modifiedData, lid);
        return Promise.all([usr, mailContent]);
      })
      .then((result) => {
        let usr = result[0];
        let mailContent = result[1];
        lid = mailContent._id;
        return MailLetterController.sendMail(usr, lid, mailContent);
      })
      .then(() => res.send({ status: true }))
      .catch((err) => res.status(400).send({ status: false, message: err}));
  });

// TAG: [fn] 刪除一封信件（只允許status為draft、cancel）
MailLetterAPI.delete('/del/:lid', (req, res) => {
  let lid = req.params.lid || null;
  console.log("router's lid = "+lid);
  
  identity.isSignin(req)
    .then((usr) => {
      if(!usr) return Promise.reject("not signin now");
      return MailLetterController.deleteMail(usr,lid);
    })
    .then(() => res.send({ status: true }))
    .catch((err) => res.status(400).send({ status: false, message: err}));
});

module.exports = MailLetterAPI;