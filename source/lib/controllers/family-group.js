'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const Validate = require('../controllers/validate')
const DBOP_Tree = require('../controllers/dbop_tree')

module.exports = {
  getAllMemberEmails,
}

// TAG: get all family group member email list
function getAllMemberEmails(fgid){
  if(!Validate.checkIDFormat(fgid)) 
    return Promise.reject("[family-group] invalid family group id");

  return DBOP_Tree.getFamilyByID(fgid)
    .then((family) => {
      console.log(family);
      let getPeople = family.orderArray
        .filter((element) => Validate.checkIDFormat(element))
        .map((uid) => DBOP_Tree.getPersonByID(uid));
      return Promise.all(getPeople);
    })
    .then((people) => {
      let emails = people.map((person) => person.email || null).filter((email) => email);
      console.log("[family-group] getAllMemberEmails success!");
      console.log(emails);
      return Promise.resolve(emails);
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    })
}