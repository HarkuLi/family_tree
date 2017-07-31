'use strict';

const Crypto = require('crypto');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const Validate = require('../controllers/validate')
const dbop_tree = require('../controllers/dbop_tree')
const MaillGroup = require('../controllers/mail-group')
const MaillLetter = require('../controllers/mail-letter')

const Connection = MongoClient.connect('mongodb://mongodb.harkuli.nctu.me:27017/');

module.exports = {
  exportAllData, 
  importAllData,
  getChatbotDataByUsr,
}

// export all data to file
function exportAllData(usr, fgid){
  if(!usr) return Promise.reject("[import-export][exportAllData] cannot find usr, not login.");
  if(!fgid || !Validate.checkIDFormat(fgid)) return Promise.reject("[import-export][exportAllData] fgid format is invalid.");
  
  let exportData = [];
  dbop_tree.getFamilyByUsr(usr)
    // get family data
    .then((familyData) => {
      if(!familyData) return Promise.reject("[import-export][exportAllData] cannot get this family data.");
      exportData.push(familyData);
      let getAllPerson = familyData.orderArray
        .map((pid) => (!Validate.checkIDFormat(pid)) ? null : dbop_tree.getPersonByID(pid))
        .filter((person) => person);
      return Promise.all(getAllPerson);
    })
    // get all person data
    .then((personData) => {
      // person maybe [], no check
      if(!personData) personData = [];
      exportData.push(personData);
      return getChatbotDataByUsr(usr);
    })
    // get custom chatbot database
    .then((chatBotData) => {
      exportData.push(chatBotData);
      let process = [ 
        MaillGroup.getAllData(fgid),
        MaillLetter.getAllData(fgid)
      ];
      return Promise.all(process);
    })
    // get mail groups and letters data
    .then((result) => {
      result.forEach((res) => {
        res = (!res) ? [] : res;
        exportData.push(res);
      });
      // encrypt export data
      return encryption(JSON.stringify(exportData));
    })
    // encrypt data and return cipher
    .then((cipher) => Promise.resolve(cipher))
    .catch((err) => {
      console.log("[import-export][exportData] got error. detail are below. ");
      console.log(err);
      return Promise.reject(err);
    });
}
// TODO: import file to overwrite data
function importAllData(usr, fileContent){
  if(!usr) return Promise.reject("[import-export][importAllData] cannot find usr, not login.");
  if(!fileContent) return Promise.reject("[import-export][importAllData] cannot find import file content.");

  // decrypt and check file content's integrity
  decryption(fileContent)
    .then((content) => JSON.parse(content))
    .then((content) => {
      // check data format
      if(!content instanceof Array) return Promise.reject("[import-export][importAllData] invalid file format");
      if(!content.every((service) => service instanceof Array || service instanceof Object)){
        return Promise.reject("[import-export][importAllData] detect invalid file content format");
      }
      let replaceContent = [
        {
          collectionName: "family",
          overwriteData: content[0]
        },{
          collectionName: "person",
          overwriteData: content[1]
        },{
          collectionName: "usr_"+usr,
          overwriteData: content[2]
        },{
          collectionName: "mailgroup",
          overwriteData: content[3]
        },{
          collectionName: "mailletter",
          overwriteData: content[4]
        }
      ];      
      return collections;
    })
    .then((replaceContent) => {
      let replaceProcess = replaceContent.map((service) => {
        //FIXME:
        return Connection.then((DB) => DB.collection(service.collectionName))
          .then((Col) => {
            if(service.overwriteData instanceof Array){
              let process = service.overwriteData.map((doc) => Col.replaceOne({_id: doc._id}, doc));
              return Promise.all(process);
            }else{
              let doc = service.overwriteData;
              return Promise.all(Col.replaceOne({_id: doc._id}, doc));
            }
          })
          .then((result) => {
            let checkAllReplaceResult = result.map((docResult) => {
                if(docResult.result.ok === 1) return true;
                // for error happend
                console.log(docResult);
                return false;
              }).every((res) => res);
            return (checkAllReplaceResult) ? Promise.resolve() : Promise.reject("something wrong when replace every docs");
          })
          .catch((err) => Promise.reject(err));
      });
      return Promise.all(replaceProcess);
    })
    .then(() => {
      return Promise.resolve({status: true});
    })
    .catch((err) => Promise.reject(err));
}
// encryption data, use AES-256-CBC, 256 bits key, 16 bytes iv
function encryption(plaintext){
  let iv = process.env.TREE_FILE_EXCHANGE_IV || null;
  let key = process.env.TREE_FILE_EXCHANGE_KEY || null;
  if(!key || !iv) return Promise.reject("[import-export][encryption] Cannot find key or iv.");

  // convert to buffer
  iv = Buffer.from(iv, 'base64');
  key = Buffer.from(key, 'base64');
  
  // append checksum text and convert to buffer
  plaintext += 'familytree';
  plaintext = Buffer.from(plaintext, 'utf8');

  // encrypt
  let cipher = Crypto.createCipheriv('aes-256-cbc', key, iv);
  return Promise.resolve()
    .then(() => cipher.update(plaintext, '', 'base64') + cipher.final('base64'))
    .then((ciphertext) => Promise.resolve(ciphertext))
    .catch((err) => Promise.reject(err));
}
// decryption data
function decryption(ciphertext){
  let iv = process.env.TREE_FILE_EXCHANGE_IV || null;
  let key = process.env.TREE_FILE_EXCHANGE_KEY || null;
  if(!key || !iv) return Promise.reject("[import-export][encryption] Cannot find key or iv.");

  // convert to buffer
  iv = Buffer.from(iv, 'base64');
  key = Buffer.from(key, 'base64');
  ciphertext = Buffer.from(ciphertext, 'base64');  

  // decrypt
  let decipher = Crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Promise.resolve()
    .then(() => decipher.update(ciphertext, '', 'utf8') + decipher.final('utf8'))
    // checksum text
    .then((plaintext) => 
      (plaintext.substr(-10) !== 'familytree') ? Promise.reject("[import-export][encryption] Check data integrity failed.") : plaintext.substring(0, plaintext.length-10)
    )
    .catch((err) => Promise.reject(err));
}
// temporary robot db
function getChatbotDataByUsr(usr){
  if(!usr) return Promise.reject("[import-export][getChatbotByUsr] cannot find usr, not login.");

  return Connection
    .then((DB) => DB.collection(`usr_${usr}`).find() || {})
    .then((chatBotData) => (chatBotData) ? Promise.resolve({}) : Promise.resolve(chatBotData))
    .catch((err) => Promise.reject(err));
}






// test
var p = JSON.stringify(["a",1,0,23,{"a":"b","c":"d"},{"e":1},[1,2,"c"]]);
Promise.resolve()
  .then(() => encryption(p))
  .then((ciphertext) => decryption(ciphertext))
  .then((res) => console.log(res))
  .catch((err) => console.log(err));