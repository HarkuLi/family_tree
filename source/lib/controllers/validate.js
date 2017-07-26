module.exports = {
  checkIDFormat,
}

// check fid format (12 bytes, hex, length = 12 x 2 = 24) 
function checkIDFormat(fgid){
  const regHex = /[a-fA-F\d]+\b/g;
  try{
    if(!fgid){ throw Error("[validate] Empty FamilyGroupID Input"); }
    if(!regHex.test(fgid)){ throw Error("[validate] Invalid FamilyGroupID Format"); }
    if((fgid.length % 2) !== 0){ throw Error("[validate] illegal hex string with odd length"); }
    if(fgid.length !== 24){ throw Error("[validate] illegal hex string length, must be 12 bytes"); }
  }catch(e){
    console.log(e.message);
    return false;
  }
  return true;
}