const ObjectID = require('mongodb').ObjectID;

module.exports = {
  checkIDFormat,
  checkEmailFormat,
}

// check fid format (12 bytes, hex, length = 12 x 2 = 24) 
function checkIDFormat(_id){
  const regHex = /[a-fA-F\d]+\b/g;
  try{
    if(typeof(_id) === 'object'){ _id = _id.toHexString() }
    if(!_id){ throw Error("[validate] No ID Input"); }
    if(!regHex.test(_id)){ throw Error("[validate] Invalid ID Format"); }
    if((_id.length % 2) !== 0){ throw Error("[validate] illegal hex string with odd length"); }
    if(_id.length !== 24){ throw Error("[validate] illegal hex string length, must be 12 bytes"); }
  }catch(e){
    console.log(e.message);
    return false;
  }
  return true;
}
// check email format
function checkEmailFormat(email){
  const regHex = /[\w\.]+\@([\w]+\.)+([\w]+)/ig;
  try{
    if(!email){ throw Error("[validate] No email Input"); }
    if(!regHex.test(email)){ throw Error("[validate] Invalid email Format"); }
  }catch(e){
    console.log(e.message);
    return false;
  }
  return true;
}