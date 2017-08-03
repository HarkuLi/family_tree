/**
 * database operations for dialog collection in linebot db
 */
const Mongo = require("mongodb"); //for ObjectId()
const dbConnect = require("./db");

var getDialogList = (usr, talkerId) => {
  var colleName = "usr_" + usr;
  var colle;

  return dbConnect.getDb_lb
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

module.exports = {getDialogList, resMapUpsert, resMapDelete, enableDialog};