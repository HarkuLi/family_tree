const express = require('express');
const tree = require("../controllers/tree");
const identity = require("../controllers/identity");
const dbop_tree = require("../controllers/dbop_tree");

const app = express();

app.use((req, res, next)=>{
  identity.isSignin(req)
    .then((usr)=>{
      if(usr) return next();
      res.redirect("/");  //please signin
    });
});

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
  identity.isSignin(req)
    .then((usr)=>{
      var DATA;
      if(req.body.kind === "mate"){
        DATA = {
          mate_id: req.body.id,
          kind: req.body.kind,
          children: req.body.children //it is string instead of list because of passing data
        };
      }
      else if(req.body.kind === "root"){
        DATA = {
          kind: req.body.kind
        };
      }
      else{
        DATA = {
          parent_id: req.body.id,
          kind: req.body.kind,
        };
      }
      DATA.usr = usr;
      res.render("pages/add_person", DATA);
    });
});

app.post("/add_root", (req, res)=>{
  var detail = req.body;
  var usr;

  identity.isSignin(req)
    .then((usr_name)=>{
      if(!usr_name) return false;
      usr = usr_name;
      return dbop_tree.getFamilyByUsr(usr_name);
    })
    .then((item)=>{
      if(!item) return false;
      else if(item.orderArray.length) return false;
      return dbop_tree.newRoot(usr, detail);
    })
    .then(()=>{
      res.redirect("/tree");
    });
});

app.post("/add_mate", (req, res)=>{
  var detail = req.body;

  if(detail.children.length)
    detail.children = JSON.parse(detail.children);
  else
    delete detail.children;

  identity.isSignin(req)
    .then((usr)=>{
      if(!usr) return;
      return dbop_tree.addMate(usr, detail);
    })
    .then(()=>{
      res.redirect("/tree");
    });
});

app.post("/add_child", (req, res)=>{
  var detail = req.body;
  detail.parents = [detail.parents];

  identity.isSignin(req)
    .then((usr)=>{
      if(!usr) return;
      return dbop_tree.addChild(usr, detail);
    })
    .then(()=>{
      res.redirect("/tree");
    });
});

app.post("/delete_node", (req, res)=>{
  identity.isSignin(req)
    .then((usr)=>{
      if(!usr) return;
      if(req.body.kind === "mate")
        return dbop_tree.removeMate(usr, req.body.id);

      return dbop_tree.remove(usr, req.body.id);
    })
    .then(()=>{
      res.redirect("/tree");
    });
});

// 404
app.use((req,res) => {res.status(404).render('pages/error.ejs', { code: 404 })});

module.exports = app;