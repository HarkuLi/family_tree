const express = require('express');
const tree = require("../controllers/tree");
const identity = require("../controllers/identity");
const dbop_tree = require("../controllers/dbop_tree");

const app = express();

app.get("/", (req, res)=>{
  var usr = false;
  identity.isSignin(req)
    .then((user)=>{
      if(!user)  return {orderArray: []};
      usr = user;
      return dbop_tree.getFamilyByUsr(user);
    })
    .then((item)=>{
      return tree.orderArrayHandle(item.orderArray);
    })
    .then((objList)=>{
      var DATA = {
        objList,
        usr
      };
      res.render("pages/tree", DATA);
    });
});

app.post("/OA", (req, res)=>{
  identity.isSignin(req)
    .then((usr)=>{
      if(!usr)  return {orderArray: []};
      return dbop_tree.getFamilyByUsr(usr);
    })
    .then((item)=>{
      return tree.orderArrayHandle(item.orderArray);
    })
    .then((objList)=>{
      res.json(objList);
    });
});

app.post("/add_person", (req, res)=>{
  var PERSON_DATA;
  if(req.body.kind === "mate"){
    var PERSON_DATA = {
      mate_id: req.body.id,
      kind: req.body.kind,
      children: req.body.children //it is string instead of list because of passing data
    };
  }
  else{
    var PERSON_DATA = {
      parent_id: req.body.id,
      kind: req.body.kind,
    };
  }
  res.render("pages/add_person", PERSON_DATA);
});

app.post("/add_mate", (req, res)=>{
  var familyId = test_family_id;   /** retrieve from cookie */
  var detail = req.body;
  if(detail.children.length)
    detail.children = JSON.parse(detail.children);
  else
    delete detail.children
  dbop_tree.addMate(familyId, detail)
    .then(()=>{
      res.redirect("/");
    });
});

app.post("/add_child", (req, res)=>{
  var familyId = test_family_id;   /** retrieve from cookie */
  var detail = req.body;
  detail.parents = [detail.parents];
  dbop_tree.addChild(familyId, detail)
    .then(()=>{
      res.redirect("/");
    });
});

app.post("/delete_node", (req, res)=>{
  var familyId = test_family_id;   /** retrieve from cookie */
  if(req.body.kind === "mate"){
    dbop_tree.removeMate(familyId, req.body.id)
      .then(()=>{
        res.redirect("/");
      });
  }
  else{
    dbop_tree.remove(familyId, req.body.id)
      .then(()=>{
        res.redirect("/");
      });
  }
});

module.exports = app;