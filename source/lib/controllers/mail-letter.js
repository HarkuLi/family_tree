'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const Validate = require('../controllers/validate')
const Nodemailer = require('nodemailer');

const CollectionName = 'mailletter';
const Connection = MongoClient.connect('mongodb://localhost:3000/familytree');
const Collection = Connection.then((DB) => DB.collection(CollectionName));

module.exports = {
  getMailList,
  getMail,
  putMail,
  deleteMail,
}
// TAG:
function getMailList(fgid, filter = {}){
  const listProjection = { createTime: 1, subject: 1, from: 1, status: 1, tags: 1, _id: 1 };
  // TODO:process filter

  // check fgid format
  if(!Validate.checkIDFormat(fgid)) return Promise.reject("[mail-letter] family group id format is invalid.");

  // find all mail with this person
  return Collection
    .then((Col) => {
      return new Promise((resolve, reject) => {
        Col.find({fgid: fgid}, listProjection).sort({createTime: -1}).limit(20).toArray((err, list) => {
          if(err) reject(err);
          console.log('[mail-letter] getMailList success.');
          resolve(list);
        });
      });
    })
    .then((list) => Promise.resolve(list) || Promise.resolve(null))
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}
// TAG:
function getMail(lid){
  const Projection = { fgid: 0 };
  // check mid format
  if(!Validate.checkIDFormat(lid)) return Promise.reject("[mail-letter] letter id format is invalid.");

  // find mail with mid
  return Collection
    .then((col) => col.findOne({
        _id: { $eq: new ObjectID(lid) }, 
        status: { $ne: 'deleted' }
      }, Projection))
    .then((mail) => {
      console.log(`[mail-letter] getMail with mid = ${lid} success.`);
      return Promise.resolve(mail);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}
// TAG:
function putMail(lid = null, modifiedData, upsert = true){
  const option = {
    upsert: upsert,
    returnOriginal: false,
    projection: { fgid: 0 }
  };
  console.log(lid);
  // check lid format if lid exist
  if(lid){
    if(!Validate.checkIDFormat(lid)) return Promise.reject("[mail-letter] mail id format error");
  }

  // TODO:check modifiedData format
  
  return Promise.resolve(lid)
    // if no lid, jump to upsert part
    .then((lid) => (lid) ? getMail(lid) : Promise.reject())
    // update data if status is draft or pending
    .then((mail) => {
      if(mail && (mail.status === 'draft' || mail.status === 'pending')){
        return Promise.resolve(Collection);
      }else{
        return Promise.reject("update a mail only if status is draft or pending");
      }
    })
    .catch(() => Promise.resolve(Collection))
    // update or insert data (upsert)
    .then((col) => col.findOneAndUpdate({_id: new ObjectID(lid)}, { $set: modifiedData }, option))
    .then((result) => {
      if(result.ok !== 1) return Promise.reject(result);
      //console.log(result);
      (lid) ? console.log(`[mail-letter] putMail with mid = ${lid} success.`) : console.log(`[mail-letter] putMail new success.`);
      return Promise.resolve(result.value);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}
// TAG:
function deleteMail(lid){
  let modifiedData = {
    status: "deleted",
    autoSend: false,
    reserveTime: '',
    deprecateTime: new Date().getTime()
  };

  // change status not real delete
  return putMail(lid, modifiedData, false)
    .then((res) => {
      console.log(`[mail-letter] deleteMail with mid = ${lid} success.`);
      return Promise.resolve(res);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}

function sendMail(){
  // mac app password
  const macPass = 'jirpoqjcxyoysfeq';

  // create reusable transporter object using the default SMTP transport
  let transporter = Nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // secure:true for port 465, secure:false for port 587
      auth: {
          user: 'einfachstudio@gmail.com',
          pass: macPass
      }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"Einfach Studio" <test@tree.com>', // sender address
      to: 'angus912584@gmail.com', // list of receivers
      subject: 'Hello', // Subject line
      text: 'Hello world', // plain text body
      html: '<b>Hello world</b>' // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) return console.log(error);
      console.log('Message %s sent: %s', info.messageId, info.response);
  });

}