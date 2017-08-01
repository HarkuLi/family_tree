var MongoClient = require('mongodb').MongoClient;
var dbop_tree = require("./dbop_tree");

const dbUrl = "mongodb://mongodb.harkuli.nctu.me:27017/linebot";

const getDb = MongoClient.connect(dbUrl);

var getDialogList = (usr, talkerId) => {
  var colleName = "usr_" + usr;
  var colle;

  return getDb
    .then(db => {
      colle = db.collection(colleName);
      return colle.find({talkerId}).toArray();
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
  return getDb
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
      return dbop_tree.getPersonByID(filterData.talkerId);
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
 * @param {Object} filterData {talkerId, pattern, response}
 * @return {Promise} a promise of deleteOne()
 */
var resMapDelete = (colleName, filterData) => {
  return getDb
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
  return getDb
    .then(db => {
      var colle = db.collection(colleName);
      return colle.updateMany(
        {talkerId},
        {$set: {enable}}
      );
    });
};

module.exports = {getDialogList, resMapUpsert, resMapDelete, enableDialog};