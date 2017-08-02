/**
 * database operations for user collection in familytree db
 */
const dbConnect = require("./db");
const bcrypt = require("bcrypt");

const collection_name = "user";
const salt_rounds = 13;
const survive_time = 60 * 60 * 24 * 7; //(s), 1 week

/** public function */
var newUser = (data)=>{
  return bcrypt.hash(data.pw, salt_rounds)
    .then((hash)=>{
      data.pw = hash;
      return dbConnect.getDb_ft;
    })
    .then((db)=>{
      var colle = db.collection(collection_name);
      colle.insertOne(data);
      return true;
    });
};

var getUserByName = (usr)=>{
  return dbConnect.getDb_ft
    .then((db)=>{
      var colle = db.collection(collection_name);
      return colle.findOne({usr});
    });
};

var signin = (usr, pw)=>{
  var colle_usr;
  var token;
  var usr_found
  return dbConnect.getDb_ft
    .then((db)=>{
      colle_usr = db.collection(collection_name);
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
      var signinTime = new Date().getTime();
      token = genToken();
      return colle_usr.updateOne(
        {usr},
        {$set: {token, signinTime}}
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
  return dbConnect.getDb_ft
    .then((db)=>{
      var colle = db.collection(collection_name);
      return colle.findOne({token});
    })
    .then((item)=>{
      if(!item) return false;
      var signinTime = item.signinTime;
      var currentTime = new Date().getTime();
      var tokenAge = (currentTime - signinTime) / 1000;
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

module.exports = {survive_time, newUser, getUserByName, signin, check_token};