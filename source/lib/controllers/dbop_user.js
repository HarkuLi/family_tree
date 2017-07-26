/**
 * database operations for user collection
 */
var MongoClient = require('mongodb').MongoClient;
const bcrypt = require("bcrypt");

const dbUrl = "mongodb://127.0.0.1:3000/familytree";
const collection_name = 'user';
const salt_rounds = 13;
const survive_time = 60 * 60 * 24 * 7; //(s), 1 week

var getColle = MongoClient.connect(dbUrl)
  .then((db)=>{
    return db.collection(collection_name);
  });

/** public function */
var newUser = (data)=>{
  return bcrypt.hash(data.pw, salt_rounds)
    .then((hash)=>{
      data.pw = hash;
      return getColle;
    })
    .then((colle)=>{
      colle.insertOne(data);
      return 1;
    });
};

var getUserByName = (usr)=>{
  return getColle
    .then((colle)=>{
      return colle.findOne({usr});
    });
};

var login = (usr, pw)=>{
  var colle_usr;
  var token;
  var usr_found
  return getColle
    .then((colle)=>{
      colle_usr = colle;
      return colle_usr.findOne({usr});
    })
    .then((item)=>{
      usr_found = item;
      //generate a fake password hash to ensure the check time is the same whenever the usr exists or not
      return bcrypt.hash("", salt_rounds);
    })
    .then((hash)=>{
      let pw_hash = usr_found ? usr_found.pw : hash;
      return bcrypt.compare(pw, pw_hash);
    })
    .then((rst)=>{
      if(!rst || !pw.length) return false;
      var loginTime = new Date().getTime();
      token = genToken();
      return colle_usr.updateOne(
        {usr},
        {$set: {token, loginTime}}
      );
    })
    .then((rst)=>{
      if(rst === false) return false;
      return token;
    });
};

/** return usr if checked or retrun false */
var check_token = (token)=>{
  token = token || false;
  return getColle
    .then((colle)=>{
      return colle.findOne({token});
    })
    .then((item)=>{
      if(!item) return false;
      var loginTime = item.loginTime;
      var currentTime = new Date().getTime();
      var tokenAge = (currentTime - loginTime) / 1000;
      if(tokenAge < survive_time) return item.usr;
      return false;
    });
};
/** public function */

/** private function */
var genToken = ()=>{
  var rst = "";
  var contentLen = 100;
  for(let i=0; i<contentLen; ++i){
      let ascii = Math.floor(Math.random()*75)+48;
      rst += String.fromCharCode(ascii);
  }
  return rst;
};
/** private function */

module.exports = {survive_time, newUser, getUserByName, login, check_token};