'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const Validate = require('../controllers/validate')
const dbop_tree = require('../controllers/dbop_tree')
const CollectionName = 'mailgroup';
const Connection = MongoClient.connect('mongodb://localhost:3000/familytree');
const Collection = Connection.then((DB) => DB.collection(CollectionName));

module.exports = {
  getGroupList,
  getGroup,
  putGroup,
  deleteGroup,
  getGroupMemberEmails,
  putGroupMember,
  deleteGroupMember,
}

// TAG: get all group list
function getGroupList(fgid){
  const listProjection = { name: 1, _id: 1, memberlist: 1 };

  // check fgid format
  if(!Validate.checkIDFormat(fgid)) return Promise.reject("[mail-group] family group id format is invalid.");

  // find all mail with this person
  return Collection
    .then((Col) => {
      return new Promise((resolve, reject) => {
        Col.find({
          fgid: {$eq: fgid}, 
          enable: {$ne: false}
        }, listProjection)
           .sort({createTime: -1}).toArray((err, list) => {
            if(err) reject(err);
            console.log('[mail-group] getGroupList success.');
            resolve(list);
          });
      });
    })
    .then((list) => {
      if(!list) return Promise.resolve([]);
      let getEveryGroup = list.map((group) => getGroup(group._id, {}));
      return Promise.all(getEveryGroup);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}
// TAG: get detail from a group and even every person
function getGroup(mgid, display){
  const Projection = display || { fgid: 0 };
  // check mid format
  if(!Validate.checkIDFormat(mgid)) return Promise.reject("[mail-group] mail group id format is invalid.");

  // find mail with mid
  return Collection
    .then((col) => col.findOne({_id: new ObjectID(mgid), enable: {$ne: false}}, Projection))
    .then((group) => {
      // group not found
      if(!group) return Promise.resolve(group);

      // for getting every member name
      let memberlist = group.memberlist || [];
      let getMemberDetail = memberlist.filter((member) => member !== {}).map((member) => {
        if(!member.pid){
          // member who is not in the tree
          if(!member.name) member.name = 'unnamed member';
          return Promise.resolve(member);
        }
        return dbop_tree
          .getPersonByID(member.pid)
          .then((person) => {
            member.name = (!person) ? 'unkown' : person.name;
            return Promise.resolve(member);
          });
      })
      console.log(`[mail-group] getGroup with mgid = ${mgid} success.`);
      return Promise.all(getMemberDetail)
        .then((memberlist) => {
          group.memberlist = memberlist;
          return Promise.resolve(group);
        });
    })
    .then((memberlist) => Promise.resolve(memberlist))
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}
// TAG: update group include add member
function putGroup(mgid = null, modifiedData, upsert = true){
  const option = { 
    upsert: upsert, 
    returnOriginal: false 
  };
  modifiedData.modifyTime = new Date().getTime();

  if(mgid){
    if(!Validate.checkIDFormat(mgid)) return Promise.reject("[mail-group] mail group id format error");
  }
  return Collection
    // update or insert data (upsert)
    .then((col) => col.findOneAndUpdate({
      _id: new ObjectID(mgid), 
      enable: {$ne: false}
    }, { 
      $set: modifiedData,
      $setOnInsert: { createTime: new Date().getTime() }
    }, option))
    .then((result) => {
      if(result.ok !== 1) return Promise.reject(result);
      (mgid) ? console.log(`[mail-group] putGroup with mid = ${mgid} success.`) : console.log(`[mail-group] putGroup new success.`);
      return Promise.resolve(result.value);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}
// TAG: change to disable
function deleteGroup(mgid){
  let modifiedData = {
    enable: false,
    modifyTime: new Date().getTime(),
    deprecateTime: new Date().getTime()
  };

  // change enable not real delete
  return putGroup(mgid, modifiedData, false)
    .then((res) => {
      console.log(`[mail-group] deleteGroup with mid = ${mgid} success.`);
      return Promise.resolve(res);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}
 // TAG: for preparation
function getGroupMemberEmails(mgid){
  const display = { memberlist: 1, _id: 0 };
  return getGroup(mgid, display)
    .then((memberlist) => Promise.resolve(memberlist))  // object array
    .catch((err) => Promise.reject(err));
}
// TAG: add new member with update group 
// rawData: { name: xxx, email: xxx } or { pid:xxx }
function putGroupMember(mgid, rawData){
  if(!Validate.checkIDFormat(mgid)) return Promise.reject("[mail-group] mail group id format error");
  if(rawData.email){
    if(!Validate.checkEmailFormat(rawData.email)) return Promise.reject("[mail-group] added email format is invalid.");
  }
  let memberData = { mbid: new ObjectID() };
  const option = { upsert: false, returnOriginal: false };
  
  for(let attr in rawData){
    switch(attr){
      case 'addPid': memberData.pid = rawData[attr]; break;
      case 'addName': memberData.name = rawData[attr]; break;
      case 'addEmail': memberData.email = rawData[attr]; break;
    }
  }
  return Collection
    .then((col) => col.findOneAndUpdate({
      _id: new ObjectID(mgid), 
      enable: {$ne: false}
    }, {
      $addToSet: { memberlist: memberData },
      $set: { modifyTime: new Date().getTime() },
    }, option))
    .then((result) => {
      if(result.ok !== 1) return Promise.reject(result);
      console.log(`[mail-group] putGroupMember with mid = ${mgid} success.`);
      return Promise.resolve(result.value);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}
// TAG: remove a member from group (real remove)
function deleteGroupMember(mgid, mbid){
  if(!Validate.checkIDFormat(mgid)) return Promise.reject("[mail-group] mail group id format error");
  if(!Validate.checkIDFormat(mbid)) return Promise.reject("[mail-group] member id format error");
  //if(!Validate.checkEmailFormat(email)) return Promise.reject("[mail-group] added email format is invalid.");
  const option = {
    upsert: false,
    returnOriginal: false
  };

  return Collection
    .then((col) => col.findOneAndUpdate({
      _id: new ObjectID(mgid), 
      enable: {$ne: false}
    }, {
      $pull: { memberlist: { mbid: new ObjectID(mbid) } },
      $set: { modifyTime: new Date().getTime() }
    }, option))
    .then((result) => {
      if(result.ok !== 1) return Promise.reject(result);
      console.log(`[mail-group] deleteGroupMember with mgid = ${mgid}, mbid = ${mbid} success.`);
      return Promise.resolve(result.value);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    });
}