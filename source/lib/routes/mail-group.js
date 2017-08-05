'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const identity = require("../controllers/identity");
const MailGroupController = require("../controllers/mail-group");
const FamilyGroupController = require("../controllers/family-group");
const config = require('../../config/default');
const MailGroupAPI = express.Router();

// TAG: [v] 顯示mail group list
MailGroupAPI.get('/', (req, res) => {
  var usr = false;
  var fgUrl = config.fgUrlRoot;
  let getUsr = identity.isSignin(req).then((usr) => usr);
  let getFGID = identity.getFamilyID(req).then((fgid) => fgid);
  
  Promise.all([getUsr, getFGID])
    .then((result) => {
      // check login status
      if(!result[0])  return Promise.reject("[mail-group] no login");
      if(!result[1])  return Promise.reject("[mail-group] cannot find fgid by usr");
      let fgid = result[1];
      usr = result[0];
      fgUrl += fgid;
      return MailGroupController.getGroupList(fgid);
    })
    .then((list) => res.render('pages/fg.ejs', { page: "mailgroup", list, fgUrl, usr }))
    .catch((err) => {
      console.log(err);
      res.status(404).render('pages/error.ejs', { code: 404, usr });
    });
});

MailGroupAPI.route('/edit/:mgid?')
  // TAG: [v] 新增、修改mail group
  .get((req, res) => {
    var usr = false;
    let mgid = req.params.mgid || null;
    var fgUrl = config.fgUrlRoot;
    let getUsr = identity.isSignin(req).then((usr) => usr);
    let getFGID = identity.getFamilyID(req).then((fgid) => fgid);
    
    Promise.all([getUsr, getFGID])
      .then((result) => {
        // check login status
        if(!result[0])  return Promise.reject("[mail-group] no login");
        if(!result[1])  return Promise.reject("[mail-group] cannot find fgid by usr");
        let fgid = result[1];
        usr = result[0];
        fgUrl += fgid;
        
        // 無mgid -> 新增mail group的popup頁面
        if(!mgid){
          res.render('partials/mask/mg-editor', { page: "putGroup", mgid: null, groupContent: null, client: true });
          return Promise.resolve('bypass');
        }
        return MailGroupController.getGroup(mgid);
      })
      .then((groupContent) => {
        // no mgid and bypass this step
        if(groupContent === 'bypass') return;  
        if(mgid && !groupContent) return Promise.reject(`[mail-group] mail not found with lid = ${mgid}`);
        // for group not found
        if(!groupContent) groupContent = {};  
        // [v] 有mgid -> 修改個別mail group的頁面
        res.render('partials/mask/mg-editor', { page: "putGroup", mgid, groupContent, client: true });
      })
      .catch((err) => res.status(400).send({ status: false, message: err }));
  })

  // TAG: [fn] 新增、修改mail group
  .put((req, res) => {
    // [fn] 有mgid -> 更新mail group設定
    //      無mgid -> 新增一個mail group
    let mgid = req.params.mgid || null;
    let getUsr = identity.isSignin(req).then((usr) => usr);
    let getFGID = identity.getFamilyID(req).then((fgid) => fgid);
    
    Promise.all([getUsr, getFGID])
      .then((result) => {
        // check login status
        if(!result[0])  return Promise.reject("[mail-group] no login");
        if(!result[1])  return Promise.reject("[mail-group] cannot find fgid by usr");
        let sendData = req.body;
        sendData.usr = result[0];
        sendData.fgid = result[1];
        return MailGroupController.putGroup(mgid, sendData);
      })
      .then(() => res.send({ status: true }))
      .catch((err) => res.status(400).send({ status: false, message: err}));
  });

// TAG: [fn] 刪除一個mail group
MailGroupAPI.delete('/del/:mgid', (req, res) => {
  let mgid = req.params.mgid || null;
  
  identity.isSignin(req)
    .then((usr) => {
      if(!usr) return Promise.reject("[mail-group] not signin now");
      return MailGroupController.deleteGroup(mgid);
    })
    .then(() => res.send({ status: true }))
    .catch((err) => res.status(400).send({ status: false, message: err}));
});

// TAG: [fn] 查詢一個mail group包含的email address
MailGroupAPI.get('/:mgid/adl', (req, res) => {
  var usr = false;
  let mgid = req.params.mgid || null;
  var fgUrl = config.fgUrlRoot;
  identity.isSignin(req)
    .then((usr) => {
      // check login status
      if(!usr)  return Promise.reject("[mail-group] no login");
      if(!mgid) return Promise.reject("[mail-group] cannot find mail group id");
      return MailGroupController.getGroupMemberEmails(mgid);
    })
    .then((emails) => res.send({ status: true, data: emails }))
    .catch((err) => res.status(400).send({ status: false, message: err }));
});

// TAG: [v][fn] 新增一筆email
MailGroupAPI.route('/:mgid/adl/add')
  .get((req, res) => {
    // [v] 在mail group新增一個email的popup頁面
    var usr = false;
    let mgid = req.params.mgid || null;
    let getUsr = identity.isSignin(req).then((usr) => usr);
    let getFGID = identity.getFamilyID(req).then((fgid) => fgid);
    
    Promise.all([getUsr, getFGID])
      .then((result) => {
        // check login status & get fgid
        if(!result[0])  return Promise.reject("[mail-group] no login");
        if(!result[1])  return Promise.reject("[mail-group] cannot find fgid by usr");
        let fgid = result[1];
        return FamilyGroupController.getAllMemberEmails(fgid);
      })
      .then((emaillist) => res.render('partials/mask/mg-editor', { page: "putGroupMember", mgid: null, emaillist, client: true }))
      .catch((err) => res.status(400).render('partials/mask/mask-error.ejs', { client: true }))
  })
  // TAG: [fn] 在mail group中新增一個email address
  .put((req, res) => {
    let mgid = req.params.mgid || null;
    identity.isSignin(req)
      .then((usr) => {
        if(!usr)  return Promise.reject("[mail-group] no login");
        return MailGroupController.putGroupMember(mgid, req.body);
      })
      .then(() => res.send({ status: true }))
      .catch((err) => res.status(400).send({ status: false, message: err}));
  });

// TAG:[fn] 從mail group中移除一個email address
MailGroupAPI.delete('/:mgid/adl/del/:mbid', (req, res) => {
  let mgid = req.params.mgid || null;
  let mbid = req.params.mbid || null;
  
  identity.isSignin(req)
    .then((usr) => {
      if(!usr) return Promise.reject("[mail-group] not signin now");
      return MailGroupController.deleteGroupMember(mgid, mbid);
    })
    .then(() => res.send({ status: true }))
    .catch((err) => res.status(400).send({ status: false, message: err}));
});

module.exports = MailGroupAPI;