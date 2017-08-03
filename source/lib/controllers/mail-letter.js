'use strict';

const dbConnect = require("./db");
const ObjectID = require('mongodb').ObjectID;
const Validate = require('../controllers/validate')
const DBOP_Tree = require('../controllers/dbop_tree')
const MailGroup = require('../controllers/mail-group')
const Nodemailer = require('nodemailer');

const CollectionName = 'mailletter';

module.exports = {
  getAllData,
  getMailList,
  getMail,
  putMail,
  deleteMail,
  sendMail,
  TimestampToDisplay,
}

// TAG: get all data in mailgroup collection
function getAllData(fgid){
  // check fgid format
  if(!Validate.checkIDFormat(fgid)) return Promise.reject("[mail-letter][getAllData] family group id format is invalid.");
  
  return dbConnect.getDb_ft
    .then((db) => {
      var Col = db.collection(CollectionName);
      return Col.find({fgid: {$eq: fgid}}, {}).sort({createTime: -1}).toArray();
    })
    .then((list) => (!list) ?  Promise.resolve([]) : Promise.resolve(list))
    .catch((err) => Promise.reject(err));
}

// TAG:
function getMailList(fgid, filter = {}){
  const listProjection = { createTime: 1, subject: 1, from: 1, status: 1, tags: 1, _id: 1 };
  // check fgid format
  if(!Validate.checkIDFormat(fgid)) return Promise.reject("[mail-letter] family group id format is invalid.");

  // find all mail with this person
  return dbConnect.getDb_ft
    .then((db) => {
      var Col = db.collection(CollectionName);
      return new Promise((resolve, reject) => {
        Col.find({
          fgid: { $eq: fgid }, 
          status: { $ne: 'deleted' }
        }, listProjection).sort({createTime: 1}).limit(20).toArray((err, list) => {
          if(err) reject(err);
          console.log('[mail-letter] getMailList success.');
          resolve(list);
        });
      });
    })
    .then((list) => Promise.resolve(list) || Promise.resolve(null))
    .catch((err) => Promise.reject(err));
}
// TAG:
function getMail(lid){
  const Projection = { fgid: 0 };
  // check mid format
  if(!Validate.checkIDFormat(lid)) return Promise.reject("[mail-letter] letter id format is invalid.");

  // find mail with mid
  return dbConnect.getDb_ft
    .then((db) => {
      var col = db.collection(CollectionName);
      return col.findOne(
        { _id: { $eq: new ObjectID(lid) }, status: { $ne: 'deleted' } },
        Projection);
    })
    .then((mail) => {
      console.log(`[mail-letter] getMail with mid = ${lid} success.`);
      return Promise.resolve(mail);
    })
    .catch((err) => Promise.reject(err));
}
// TAG:
function putMail(usr, modifiedData, lid = null, upsert = true){
  console.log("putMail's input lid = "+lid);
  const option = { upsert: upsert, returnOriginal: false, projection: { fgid: 0 } };
  // check lid format if lid exist
  if(lid){
    if(!Validate.checkIDFormat(lid)) return Promise.reject("[mail-letter] mail id format error");
  }
  modifiedData.modifiedTime = new Date().getTime();
  
  return Promise.resolve(lid)
    // if no lid, jump to upsert part
    .then((lid) => (lid) ? getMail(lid) : Promise.reject())
    // update data if status is draft or pending
    .then((mail) => {
      if(mail && (mail.status === 'draft' || mail.status === 'pending')){
        return Promise.resolve(dbConnect.getDb_ft);
      }else{
        return Promise.reject("update a mail only if status is draft or pending");
      }
    })
    .catch(() => Promise.resolve(dbConnect.getDb_ft))
    // update or insert data (upsert)
    .then((db) => {
      var col = db.collection(CollectionName);
      return col.findOneAndUpdate({_id: new ObjectID(lid)}, { $set: modifiedData, $setOnInsert: { createTime: new Date().getTime() }}, option);
    })
    .then((result) => {
      if(result.ok !== 1) return Promise.reject(result);
      //console.log(result);
      (lid) ? console.log(`[mail-letter] putMail with mid = ${lid} success.`) : console.log(`[mail-letter] putMail new success.`);
      return Promise.resolve(result.value);
    })
    .catch((err) => Promise.reject(err));
}
// TAG:
function deleteMail(usr, lid){
  let modifiedData = {
    status: "deleted",
    autoSend: false,
    reserveTime: '',
    modifyTime: new Date().getTime(),
    deprecateTime: new Date().getTime()
  };

  // change status not real delete
  return putMail(usr, modifiedData, lid, false)
    .then((res) => {
      console.log(`[mail-letter] deleteMail with mid = ${lid} success.`);
      return Promise.resolve(res);
    })
    .catch((err) => Promise.reject(err));
}

function sendMail(usr, lid, sendOptions){
  // INFO: Use GMAIL for Temporary Choice UNLESS Haraka SMTP Server established

  console.log(lid);
  let transporter = Nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // secure:true for port 465
      auth: { user: 'einfachstudio@gmail.com',pass: process.env.GMAIL_KEY }
  });

  // check autoSend
  let now = new Date().getTime();
  if(sendOptions.autoSend && new Date(sendOptions.reserveTime).getTime() > now){
    return Promise.resolve({sending: false, message: "Not the reserved time to send mail"});
  }

  return DBOP_Tree
    // get family data from db (familyname)
    .getFamilyByUsr(usr)
    .then((family) => {
      // set default and check mail options
      sendOptions.familyname = family.name || 'unknown';
      return Promise.resolve(checkMailOptions(sendOptions));
    })
    .then((mailOptions) =>{
      if(!mailOptions.to){
        //FIXME: change status to 'cancel' and autoSend to 'false';
        return putMail(usr, {status: "cancel", autoSend: false, $addToSet:{ tags: "error"}}, lid)
          .then(() => Promise.reject("No receiver setting."))
          .catch((err) => Promise.reject(err));
      }
      return transporter.sendMail(mailOptions, (err, info) => {
        if (err){
          console.log(err);
          return Promise.reject(err);
        }
        console.log('Mail %s sent: %s', info.messageId, info.response);
        return Promise.resolve();
      })
    })
    // update status and sendtime
    .then(() => putMail(usr, { status: "success", sendTime: new Date().getTime() }, lid))
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}

// TAG: check and set default value with mail content
function checkMailOptions(sendOptions){
  let mailOptions = {};
  mailOptions.from = `"${sendOptions.familyname}"`;
  mailOptions.subject = sendOptions.subject || `[FamilyGroup] New Message from ${sendOptions.familyname}.`;
  mailOptions.html = sendOptions.context || '';

  // convert mail group to legal email address string in nodemailer
  let process = [
    E_MG_ListToEmails(sendOptions.to).then((v) => mailOptions.to = v),
    (!sendOptions.cc) ? mailOptions.cc = '' : E_MG_ListToEmails(sendOptions.cc).then((v) => mailOptions.cc = v),
    (!sendOptions.bcc) ? mailOptions.bcc = '' : E_MG_ListToEmails(sendOptions.bcc).then((v) => mailOptions.bcc = v)
  ];
  
  return Promise.all(process).then(() => mailOptions);
}

// TAG: change mail group and email mixed list to address list
function E_MG_ListToEmails(e_mg_list){
  let groupRegExp = /\".*\"\s*\[group\:([0-9a-f]{24})\]/i;
  let memberRegExp = /\".*\"\s*\<([\w_\-+]+@([\w_\-+]+)(\.[\w_\-+]+)+)\>/i;

  let process = e_mg_list.split(',').map((item) => {
    item = item.trim(" ");

    // "xxxx" <xxx@xxx>
    if(memberRegExp.test(item)){ return item; }

    // "xxxx" <xxx@xxx>,"oooo" <ooo@oo>.......
    if(groupRegExp.test(item)){
      let mgid = item.match(groupRegExp)[1];
      return MailGroup.getGroup(mgid, {memberlist: 1})
        .then((group) => {
          // for getting every member
          let memberlist = group.memberlist || [];
          return memberlist.filter((member) => member !== {});
        })
        .then((memberlist) => {
          let process_inner = memberlist.map((member) => {
            // member who is not in the tree
            if(!member.pid) return `"${member.name}" <${member.email}>`;
            // member who is in the tree, get their detail
            return new Promise((resolve, reject) => {
              DBOP_Tree.getPersonByID(member.pid)
                .then((person) => resolve(`"${person.name}" <${person.email}>`))
                .catch((err) => reject(err));
            });
          });
          return Promise.all(process_inner);
        })
        .then((emaillist) => emaillist.join(','))
        .catch((err) => Promise.reject(err));
    }
    // not the "xxx" <xxx@xx> format, get only email part
    let emailRegExp = /[\w_\-+]+@([\w_\-+]+)(\.[\w_\-+]+)+/i;
    let ary = item.match(emailRegExp);
    return (!ary || ary.lentgh === 0) ? null : ary[0];
  }).filter((v) => v, []);

  return Promise.race(process)
    .then((AddressStrArray) => {
      if(!AddressStrArray) return Promise.reject("No receiver can be process.");
      return (!(AddressStrArray instanceof Array)) ? AddressStrArray : AddressStrArray.join(',');
    })
    .catch((err) => {
      console.log("[mail-letter][E_MG_ListToEmails] Something Error:");
      console.log(err);
      return false;
    });
}
// TAG: change timestamp to yyyy-mm-dd hh:mm
function TimestampToDisplay(timestamp){
  let time = new Date(timestamp);
  let year = time.getFullYear();
  let month = (time.getMonth() < 10) ? '0'+time.getMonth().toString() : time.getMonth().toString();;
  let date = (time.getDate() < 10) ? '0'+time.getDate() : time.getDate();
  let hours = (time.getHours() < 10) ? '0'+time.getHours() : time.getHours();
  let minutes = (time.getMinutes() < 10) ? '0'+time.getMinutes() : time.getMinutes();
  return `${year}-${month}-${date} ${hours}:${minutes}`; 
}