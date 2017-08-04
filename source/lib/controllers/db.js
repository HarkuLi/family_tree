const MongoClient = require('mongodb').MongoClient;

const user_ft = process.env.USER_FT;
const pwd_ft = process.env.PWD_FT;
const user_lb = process.env.USER_LB;
const pwd_lb = process.env.PWD_LB;

var dbUrl_ft;
var dbUrl_lb;

//remote db
if(process.env.DB_URL){
  let idx_start = process.env.DB_URL.indexOf("/") + 2;
  let domain = process.env.DB_URL.slice(idx_start);
  dbUrl_ft = "mongodb://" + user_ft + ":" + pwd_ft + "@" + domain + "familytree";
  dbUrl_lb = "mongodb://" + user_lb + ":" + pwd_lb + "@" + domain + "linebot";
}
//local db
else{
  dbUrl_ft = "mongodb://ftDB:27017/familytree";
  dbUrl_lb = "mongodb://ftDB:27017/linebot";
}

const getDb_ft = MongoClient.connect(dbUrl_ft);
const getDb_lb = MongoClient.connect(dbUrl_lb);

module.exports = {getDb_ft, getDb_lb};