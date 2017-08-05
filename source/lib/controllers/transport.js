'use strict';

const Crypto = require('crypto');
const dbConnect = require("./db");
const ObjectID = require('mongodb').ObjectID;
const Validate = require('../controllers/validate')
const dbop_tree = require('../controllers/dbop_tree')
const dbop_dialog = require('../controllers/dbop_dialog')
const MaillGroup = require('../controllers/mail-group')
const MaillLetter = require('../controllers/mail-letter')

module.exports = {
  exportAllData, 
  importAllData,
}

/** 
 * TAG: export all data to file
 * @param {String} usr
 * @param {String} fgid, family's _id
 */
function exportAllData(usr, fgid){
  if(!usr) return Promise.reject("[import-export][exportAllData] cannot find usr, not login.");
  if(!fgid || !Validate.checkIDFormat(fgid)) return Promise.reject("[import-export][exportAllData] fgid format is invalid.");
  
  let exportData = [];
  return dbop_tree.getFamilyByUsr(usr)
    // get family data
    .then((familyData) => {
      if(!familyData) return Promise.reject("[import-export][exportAllData] cannot get this family data.");
      exportData.push(familyData);
      // remove generation number, leave only person id
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
      let process = [ 
        MaillGroup.getAllData(fgid),
        MaillLetter.getAllData(fgid)
      ];
      return Promise.all(process);
    })
    // get mail groups and letters data
    .then((mailRelatedData) => {
      mailRelatedData.forEach((res) => {
        res = (!res) ? [] : res;
        console.log("here");
        console.log(res);
        exportData.push(res);
      });
      return dbop_dialog.getChatbotDataByUsr(usr);
    })
    // get custom chatbot database
    .then((chatBotData) => {
      exportData.push(chatBotData);
      // encrypt export data
      return encryption(JSON.stringify(exportData));
    })
    // encrypt data and return cipher
    .then((cipher) => Promise.resolve(cipher))
    .catch((err) => {
      console.log("[import-export][exportData] got error. detail are below. ");
      return Promise.reject(err);
    });
}

/**
 * TAG: import file to overwrite data
 * @param {String} usr
 * @param {String} fileContent, base64 encoded ciphertext
 */
function importAllData(usr, fileContent){
  if(!usr) return Promise.reject("[import-export][importAllData] cannot find usr, not login.");
  if(!fileContent) return Promise.reject("[import-export][importAllData] cannot find import file content.");

  // decrypt and check file content's integrity
  return decryption(fileContent)
    .then((content) => {
      // check data format
      content = JSON.parse(content);
      if(!content instanceof Array) return Promise.reject("[import-export][importAllData] invalid file format");
      if(!content.every((service) => service instanceof Array || service instanceof Object)){
        return Promise.reject("[import-export][importAllData] detect invalid file content format");
      }
      // drop all family related docs
      return Promise.all([ dbop_tree.dropFamily(usr), content]);
    })
    .then((result) => {
      if(!result[0]) return Promise.reject("[import-export][importAllData] drop family error.");

      // check current usr is the same with import file's usr;
      let content = result[1];
      let importUSR = content[0].usr || null;
      if(usr !== importUSR) return Promise.reject("[import-export][importAllData] validate current usr with import file fail.");

      let overwriteContent = {
        family: content[0],
        person: content[1],
        mailgroup: content[2],
        mailletter: content[3]
      };
      overwriteContent["usr_"+usr] = content[4];
      return overwriteContent;
    })
    .then((overwriteContent) => {
      let insertProcess = [];
      for(let collecName in overwriteContent){
        let process;
        let data = overwriteContent[collecName];
        let modifyTime = new Date().getTime();
        switch(collecName){
          // { }, use replace, and add modifytime manually
          case "family": 
            // because id in export is string, in db is OBJECTID
            data._id = new ObjectID(data._id);  
            data.modifyTime = modifyTime;
            process = new Promise((resolve, reject) => 
              dbConnect.getDb_ft
                .then((DB) => DB.collection(collecName))
                .then((Col) => Col.findOneAndReplace({ _id: new ObjectID(data._id) }, data))
                .then((result) => resolve(result))
                .catch((err) => reject(err))
            ); 
            insertProcess.push(process);
            break;
          // [ {}, {}, {} ], use insert
          case "person":
          case "mailgroup":
          case "mailletter":
          case "usr_"+usr:
            // empty [ ]
            if(data.length === 0){ 
              insertProcess.push(Promise.resolve({result: {ok: 1}}));
              break;
            }
            data = data.map((doc) => {
              // because id in export is string, in db is OBJECTID
              doc._id = new ObjectID(doc._id);  
              doc.modifyTime = modifyTime;
              return doc;
            });
            process = new Promise((resolve, reject) => {
              let chooseDB = (collecName.includes("usr_")) ? dbConnect.getDb_lb : dbConnect.getDb_ft;
                chooseDB
                  .then((DB) => DB.collection(collecName))
                  .then((Col) => Col.insertMany(data))
                  .then((result) => resolve(result))
                  .catch((err) => reject(err));
            }); 
            insertProcess.push(process);
            break;
        }
      }
      return Promise.all(insertProcess);
    })
    .then((response) => {
      // for two type response: findAndModifyWriteOpResult & insertWriteOpResult
      if(response.every((result) => result.ok === 1 || result.result.ok === 1)){
        return Promise.resolve({status: true});
      }
      return Promise.reject({status: false, message: "something error"});
    })
    .catch((err) => Promise.reject(err));
}

/**
 * TAG: encryption data, use AES-256-CBC, and encoded ciphertext with base64
 * 256 bits base64 encoded key, 16 bytes base64 encoded iv load from process.env are required.
 * @param {String} plaintext, utf-8 encoded
 */
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
  /**
 * TAG: decryption base64 ciphertext into utf8 plaintext 
 * @param {String} ciphertext, base64 encoded
 */
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