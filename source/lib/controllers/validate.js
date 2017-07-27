module.exports = {
  checkIDFormat,
}

// check fid format (12 bytes, hex, length = 12 x 2 = 24) 
function checkIDFormat(_id){
  const regHex = /[a-fA-F\d]+\b/g;
  try{
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