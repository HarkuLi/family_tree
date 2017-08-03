'use strict';

const dbConnect = require("../lib/controllers/db");
const ObjectID = require('mongodb').ObjectID;
const MailLetter = require("../lib/controllers/mail-letter");

/*  config  */
const config = require('../config/default');
const collection_name = "mailletter";

function main(){
  let now = new Date();
  console.log(`${new Date()} [autosend] Start to check auto send.`)
  dbConnect.getDb_ft
    .then((db)=>{
      var colle = db.collection(collection_name);
      return colle.find({reserveTime: { $lte: new Date().getTime()}, autoSend: {$eq: true}, status: {$eq: "pending"}}).toArray();
    })
    .then((letterlist) => {
      if(letterlist.length === 0){
        console.log(`${new Date()} [autosend] No mail need to be send.`);
        return "bypass";
      }
      let process = letterlist.map((letter) => MailLetter.sendMail(letter.usr, letter._id, letter));
      return Promise.all(process);
    })
    .then((v) => {
      let nextTime = new Date((new Date().getTime()+config.autoSendCheckTime));
      if(v !== "bypass") console.log(`${new Date()} [autosend] Mail auto send success!`);
      console.log(`${new Date()} [autosend] Next Check Time is ${nextTime}`);
    })
    .then(() => setTimeout(main, config.autoSendCheckTime))
    .catch((err) => {
      console.log(`${now} [autosend] get something error, details below....`);
      console.log("--------------------------------------------------------");
      console.log(err)
      console.log("--------------------------------------------------------");
    });
}

main();
