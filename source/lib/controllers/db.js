const MongoClient = require('mongodb').MongoClient;

const serverUrl = "mongodb://mongodb.harkuli.nctu.me:27017";
const dbUrl_ft = serverUrl + "/familytree";
const dbUrl_lb = serverUrl + "/linebot";

const getDb_ft = MongoClient.connect(dbUrl_ft);
const getDb_lb = MongoClient.connect(dbUrl_lb);

module.exports = {getDb_ft, getDb_lb};