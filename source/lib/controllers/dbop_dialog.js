var MongoClient = require('mongodb').MongoClient;

const dbUrl = "mongodb://127.0.0.1:3000/linebot";

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
 * update response mapping
 * @param {String} colleName collection name
 * @param {Object} filterData {talkerId, pattern, response}
 * @param {String} newRes new response
 * @return {Promise} a promise of updateOne()
 */
var resMapUpdate = (colleName, filterData, newRes) => {
  return getDb
    .then(db => {
      var colle = db.collection(colleName);
      return colle.updateOne(filterData, {$set: {response: newRes}});
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

module.exports = {getDialogList, resMapUpdate, resMapDelete};