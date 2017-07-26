const cookie = require("cookie");
const dbop_user = require("./dbop_user");

/** return usr if logged in or retrun false */
var isSignin = (req)=>{
  // req.headers.cookie
  var cookies, token;
  if(req.headers.cookie){
    cookies = cookie.parse(req.headers.cookie);
    token = cookies.LOGIN_INFO;
  }
  return dbop_user.check_token(token);
};

module.exports = {isSignin};