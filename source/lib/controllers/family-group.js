'use strict';

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
      let getPeople = family.orderArray
        .filter((element) => Validate.checkIDFormat(element))
        .map((uid) => DBOP_Tree.getPersonByID(uid));
      return Promise.all(getPeople);
    })
    .then((people) => {
      let emaillist = people.map((person) => {
        let member = {};
        member.name = person.name || 'unknown';
        member.pid = person._id || null;
        member.email = person.email || null;
        return member;
      }).filter((member) => member.email && member.pid);
      console.log("[family-group] getAllMemberEmails success!");
      return Promise.resolve(emaillist);
    })
    .catch((err) => Promise.reject(err));
}