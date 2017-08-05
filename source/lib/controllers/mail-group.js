'use strict';

const dbConnect = require("./db");
const ObjectID = require('mongodb').ObjectID;
const Validate = require('../controllers/validate')
const dbop_tree = require('../controllers/dbop_tree')
const CollectionName = 'mailgroup';

module.exports = {
  getAllData,
  getGroupList,
  getGroup,
  putGroup,
  deleteGroup,
  getGroupMemberEmails,
  putGroupMember,
  deleteGroupMember,
}

/** 
 * TAG: get all data in mailgroup collection
 * @param {String} fgid, family's _id
 */
function getAllData(fgid){
  // check fgid format
  if(!Validate.checkIDFormat(fgid)) return Promise.reject("[mail-group][getAllData] family group id format is invalid.");
  
  return dbConnect.getDb_ft
    .then((db) => {
      var Col = db.collection(CollectionName);
      return Col.find({fgid: {$eq: fgid}}, {}).sort({createTime: -1}).toArray();
    })
    .then((list) => (!list) ?  Promise.resolve([]) : Promise.resolve(list))
    .catch((err) => Promise.reject(err));
}

/** 
 * TAG: get all group list
 * @param {String} fgid, family's _id
 */
function getGroupList(fgid){
  const listProjection = { name: 1, _id: 1, memberlist: 1 };

  // check fgid format
  if(!Validate.checkIDFormat(fgid)) return Promise.reject("[mail-group] family group id format is invalid.");

  // find all mail with this person
  return dbConnect.getDb_ft
    .then((db) => {
      var Col = db.collection(CollectionName);
      return new Promise((resolve, reject) => {
        Col.find({ fgid: {$eq: fgid}, enable: {$ne: false} }, listProjection)
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
    .catch((err) => Promise.reject(err));
}

/** 
 * TAG: get detail from a group and even every person
 * @param {String} mgid, mailgroup's _id
 * @param {Object} display projection, { filed: 1 or 0 }
 */
function getGroup(mgid, display){
  const Projection = display || { fgid: 0 };
  // check mid format
  if(!Validate.checkIDFormat(mgid)) return Promise.reject("[mail-group] mail group id format is invalid.");

  // find mail with mid
  return dbConnect.getDb_ft
    .then((db) => {
      var col = db.collection(CollectionName);
      return col.findOne({_id: new ObjectID(mgid), enable: {$ne: false}}, Projection);
    })
    .then((group) => {
      // group not found
      if(!group) return Promise.resolve(group);

      // for getting every member name
      let memberlist = group.memberlist || [];
      let getMemberDetail = memberlist.filter((member) => member !== {}).map((member) => {
        //console.log(member);
        if(!member.pid){
          // member who is not in the tree
          if(!member.name) member.name = 'unnamed member';
          return Promise.resolve(member);
        }
        return dbop_tree
          .getPersonByID(member.pid)
          .then((person) => {
            member.name = (!person) ? 'unkown' : person.name;
            member.email = (!person) ? 'unkown' : person.email;
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
    .catch((err) => Promise.reject(err));
}

/** 
 * TAG: update group include add member
 * @param {String} mgid, mailgroup's _id, NOT REQUIRED when INSERT new mailgroup
 * @param {Object} modified data
 * @param {Boolean} upsert, true will insert new mailgroup when it is not be found
 */
function putGroup(mgid = null, modifiedData, upsert = true){
  const option = { upsert: upsert, returnOriginal: false };
  modifiedData.modifyTime = new Date().getTime();
  
  if(mgid && !Validate.checkIDFormat(mgid)) return Promise.reject("[mail-group] mail group id format error");
  return dbConnect.getDb_ft
    // update or insert data (upsert)
    .then((db) => {
      var col = db.collection(CollectionName)
      return col.findOneAndUpdate(
        { _id: new ObjectID(mgid), enable: { $ne: false } },
        { $set: modifiedData,$setOnInsert: { createTime: new Date().getTime() }},
        option);
    })
    .then((result) => {
      if(result.ok !== 1) return Promise.reject(result);
      (mgid) ? console.log(`[mail-group] putGroup with mid = ${mgid} success.`) : console.log(`[mail-group] putGroup new success.`);
      return Promise.resolve(result.value);
    })
    .catch((err) => Promise.reject(err));
}

/** 
 * TAG: delete a mailgroup, soft change it to disable
 * @param {String} mgid, mailgroup's _id, required.
 */ 
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
    .catch((err) => Promise.reject(err));
}

/** 
 * TAG: get a group's all members' emails
 * @param {String} mgid, mailgroup's _id, required.
 */ 
function getGroupMemberEmails(mgid){
  const display = { memberlist: 1, _id: 0 };
  return getGroup(mgid, display)
    .then((memberlist) => Promise.resolve(memberlist))  // object array
    .catch((err) => Promise.reject(err));
}

/** 
 * TAG: add new member with update group 
 * @param {String} mgid, mailgroup's _id, required.
 * @param {Object} rawData: { name: xxx, email: xxx } or { pid:xxx }
 */ 
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
  return dbConnect.getDb_ft
    .then((db) => {
      var col = db.collection(CollectionName);
      return col.findOneAndUpdate(
        {
          _id: new ObjectID(mgid), 
          enable: {$ne: false}
        },
        {
          $addToSet: { memberlist: memberData },
          $set: { modifyTime: new Date().getTime() },
        },
        option);
    })
    .then((result) => {
      if(result.ok !== 1) return Promise.reject(result);
      console.log(`[mail-group] putGroupMember with mid = ${mgid} success.`);
      return Promise.resolve(result.value);
    })
    .catch((err) => Promise.reject(err));
}

/** 
 * TAG: remove a member from group (real remove)
 * @param {String} mgid, mailgroup's _id, required.
 * @param {String} mbid, a member's id in a mailgroup, required.
 */ 
function deleteGroupMember(mgid, mbid){
  if(!Validate.checkIDFormat(mgid)) return Promise.reject("[mail-group] mail group id format error");
  if(!Validate.checkIDFormat(mbid)) return Promise.reject("[mail-group] member id format error");
  //if(!Validate.checkEmailFormat(email)) return Promise.reject("[mail-group] added email format is invalid.");
  const option = { upsert: false, returnOriginal: false };

  return dbConnect.getDb_ft
    .then((db) => {
      var col = db.collection(CollectionName);
      return col.findOneAndUpdate(
        { _id: new ObjectID(mgid), enable: { $ne: false } },
        { $pull: { memberlist: { mbid: new ObjectID(mbid) } },
          $set: { modifyTime: new Date().getTime() } },
        option);
    })
    .then((result) => {
      if(result.ok !== 1) return Promise.reject(result);
      console.log(`[mail-group] deleteGroupMember with mgid = ${mgid}, mbid = ${mbid} success.`);
      return Promise.resolve(result.value);
    })
    .catch((err) => Promise.reject(err));
}