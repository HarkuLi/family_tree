const cookie = require("cookie");
const dbop_user = require("./dbop_user");
const dbop_tree = require("./dbop_tree");

/** TAG: return usr if logged in or retrun false */
var isSignin = (req)=>{
  // req.headers.cookie
  var cookies, token;
  if(req.headers.cookie){
    cookies = cookie.parse(req.headers.cookie);
    token = cookies.LOGIN_INFO;
  }
  return dbop_user.check_token(token);
};

/* TAG: return fgid <string> if logged in or return false */
var getFamilyID = (req) => {
  return isSignin(req)
    .then((usr) => {
      if(!usr)  return Promise.reject("[identity] no login");
      return dbop_tree.getFamilyIDByUsr(usr);
    })
    .then((result) => {
      if(!result._id)  return Promise.reject("[identity] cannot find fgid by usr");
      return Promise.resolve(result._id.toHexString());
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(false);
    });
}

module.exports = {isSignin, getFamilyID};