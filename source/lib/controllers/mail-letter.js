'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const Validate = require('../controllers/validate')

const CollectionName = 'mailletter';
const Connection = MongoClient.connect('mongodb://localhost:3000/familytree');
const Collection = Connection.then((DB) => DB.collection(CollectionName));

module.exports = {
  getMailList,
  getMail,
  putMail,
  deleteMail,
}

function getMailList(fgid, filter = {}){
  const listProjection = { createTime: 1, subject: 1, from: 1, status: 1, tags: 1 };
  // process filter

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
    .then((list) => {
      //console.log(list);
      //Connection.then((DB) => DB.close());
      return Promise.resolve(list) || Promise.resolve(null);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
      //Connection.then((DB) => DB.close());
    });
}

function getMail(mid){
  const Projection = { fgid: 0 };

  // check mid format
  if(!Validate.checkIDFormat(mid)) return Promise.reject("[mail-letter] family group id format is invalid.");

  // find mail with mid
  return Collection
    .then((col) => col.findOne({_id: new ObjectID(mid)}, Projection))
    .then((mail) => {
      console.log(mail);
      console.log(`[mail-letter] getMail with mid = ${mid} success.`);
      //Connection.then((DB) => DB.close());
      return Promise.resolve(mail);
    })
    .catch((err) => {
      console.log(err);
      //Connection.then((DB) => DB.close());
      return Promise.reject(err);
    });
}

function putMail(mid = null, modifiedData, upsert = true){
  const option = {
    upsert: upsert,
    returnOriginal: false,
    projection: { fgid: 0 }
  };

  // check mid format if mid exist
  if(mid){
    if(!Validate.checkIDFormat(mid)) return Promise.reject("[mail-letter] mail id format error");
  }

  // find mail with mid
  return Collection
    .then((col) => col.findOneAndUpdate({_id: new ObjectID(mid)}, { $set: modifiedData }, option))
    .then((result) => {
      if(result.ok !== 1) return Promise.reject(result);
      console.log(result);
      (mid) ? console.log(`[mail-letter] putMail with mid = ${mid} success.`) : console.log(`[mail-letter] putMail new success.`);
      //Connection.then((DB) => DB.close());
      return Promise.resolve(result.value);
    })
    .catch((err) => {
      console.log(err);
      //Connection.then((DB) => DB.close());
      return Promise.reject(err);
    });
}

function deleteMail(mid){
  let modifiedData = {
    status: "deleted",
    deprecateTime: new Date().getTime()
  };

  // change status not real delete
  putMail(mid, modifiedData, false)
    .then((res) => {
      console.log(res);
      console.log(`[mail-letter] deleteMail with mid = ${mid} success.`);
      return Promise.resolve(res);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}

// test
//console.log(getMailList("6a736e667061693132396664"));

/* getMail('5977183f8f5521d3d1b69622')
  .then(() => deleteMail('5977183f8f5521d3d1b69622', {from: "ggggg@domail.com"}))
  .then(() => getMail('5977183f8f5521d3d1b69622'))
  .catch((err) => console.log(err)); */