const express = require('express');
const cookie = require("cookie");
const tree = require("../controllers/tree");
const dbop_tree = require("../controllers/dbop_tree");
const dbop_user = require("../controllers/dbop_user");

const app = express();

app.get("/", (req, res)=>{
  var familyId = test_family_id;   /** retrieve from cookie */
  var TREE_DATA = {};
  dbop_tree.getFamilyByID(familyId)
    .then((item)=>{
      return tree.orderArrayHandle(item.orderArray);
    })
    .then((objList)=>{
      TREE_DATA.objList = objList;
      res.render("pages/index", TREE_DATA);
    });
});



module.exports = app;