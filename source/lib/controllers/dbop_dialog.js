/**
 * database operations for dialog collection in linebot db
 */
const Mongo = require("mongodb"); //for ObjectId()
const dbConnect = require("./db");

const DIALOGS_PER_PAGE = 10;

/**
 * @param {String} usr
 * @param {String} talkerId
 * @param {String} page not required
 * @param {Object} filter not required, {pattern, response}
 * @return {Object} {dialog_list, total_page(Number)}
 */
var getDialogList = (usr, talkerId, page, filter) => {
  var colleName = "usr_" + usr;
  var colle;
  var total_page;

  page = Number(page) || 1;
  filter = filter || {};
  filter.talkerId = talkerId;

  return dbConnect.getDb_lb
    .then(db => {
      colle = db.collection(colleName);
      return colle.count(filter);
    })
    .then(count => {
      total_page = Math.ceil(count / DIALOGS_PER_PAGE) || 1;
      if(page > total_page) page = total_page;
      else if(page < 1) page = 1;
      return colle.find(filter).sort({"_id" : -1}).skip(DIALOGS_PER_PAGE*(page-1)).limit(DIALOGS_PER_PAGE).toArray();
    })
    .then(dialog_list => {
      var rst = {
        dialog_list,
        total_page
      }
      return rst;
    });
};

/**
 * upsert response mapping
 * @param {String} colleName collection name
 * @param {Object} filterData {talkerId, pattern, response}
 * @param {String} newPat new pattern
 * @param {String} newRes new response
 * @return {Promise} a promise which return boolean result
 */
var resMapUpsert = (colleName, filterData, newPat, newRes) => {
  var colle;
  return dbConnect.getDb_lb
    .then(db => {
      //update an existed one
      colle = db.collection(colleName);
      return colle.updateOne(filterData, {$set: {response: newRes}});
    })
    .then(rst => {
      if(rst.modifiedCount) return -1;
      return colle.count({pattern: newPat, response: newRes});
    })
    .then(count => {
      if(count < 0) return true;  //updated
      if(count > 0) return false; //no upserted
      return dbConnect.getDb_ft;
    })
    .then(db => {
      if(typeof(db) === "boolean")  return db;
      var colle_person = db.collection("person");
      return colle_person.findOne({_id: Mongo.ObjectId(filterData.talkerId)});
    })
    .then(item => {
      if(!item._id) return item;  //boolean
      var enable = item.dialogEnable;
      //insert a new one
      return colle.insertOne({
        pattern: newPat,
        response: newRes,
        talkerId: filterData.talkerId,
        enable
      });
    })
    .then(rst => {
      if(rst) return true;
      return false;
    });
};

/**
 * delete response mapping
 * @param {String} colleName collection name
 * @param {Object} filterData {talkerId, pattern, response} not all required
 * @return {Promise} a promise of deleteOne()
 */
var resMapDelete = (colleName, filterData) => {
  return dbConnect.getDb_lb
    .then(db => {
      var colle = db.collection(colleName);
      return colle.deleteOne(filterData);
    });
};

/**
 * update enable properties of dialogs of id
 * @param {String} colleName collection name
 * @param {String} talkerId talker id
 * @param {Boolean} enable 
 */
var enableDialog = (colleName, talkerId, enable) => {
  return dbConnect.getDb_lb
    .then(db => {
      var colle = db.collection(colleName);
      return colle.updateMany(
        {talkerId},
        {$set: {enable}}
      );
    });
};

/**
 * get all data with usr
 * @param {String} usr
 */
var getChatbotDataByUsr = (usr) => {
  if(!usr) return Promise.reject("[import-export][getChatbotByUsr] cannot find usr, not login.");
  return dbConnect.getDb_lb
    .then((db) => db.collection(`usr_${usr}`).find().toArray() || [])
    .then((chatBotData) => (!chatBotData) ? [] : chatBotData)
    .catch((err) => Promise.reject(err));
}

module.exports = {getDialogList, resMapUpsert, resMapDelete, enableDialog, getChatbotDataByUsr};