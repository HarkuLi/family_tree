const express = require('express');
const tree = require("../controllers/tree");
const identity = require("../controllers/identity");
const dbop_tree = require("../controllers/dbop_tree");
const dbop_dialog = require("../controllers/dbop_dialog");

const app = express();

app.use((req, res, next)=>{
  identity.isSignin(req)
    .then((usr)=>{
      if(usr) return next();
      res.redirect("/");  //please signin
    });
});

app.get("/", (req, res)=>{
  identity.isSignin(req)
    .then((usr)=>{
      res.redirect("/tree/"+usr);
    });
});

app.get("/:usr", (req, res)=>{
  var usr = false;
  identity.isSignin(req)
    .then((usr_name)=>{
      if(!usr_name)  return {orderArray: []};
      usr = usr_name;
      return dbop_tree.getFamilyByUsr(usr_name);
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

app.post("/detail", (req, res)=>{
  var usr;
  var id = req.body.id;
  var detail_list = ["_id", "name", "birth", "email"];
  var dialog_list;

  identity.isSignin(req)
    .then((usr_name)=>{
      usr = usr_name;
      return dbop_dialog.getDialogList(usr, id);
    })
    .then(items => {
      dialog_list = items;
      return dbop_tree.getPersonByID(id);
    })
    .then((item)=>{
      for(let prop in item){
        if(detail_list.indexOf(prop) < 0){
          delete item[prop];
        }
      }
      item._id = id;
      
      res.render("pages/person_detail", {item, usr, dialog_list});
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

app.post("/update_person", (req, res)=>{
  var detail = req.body;
  var detail_list = ["name", "birth", "email"];
  var id = req.body._id;
  //check data
  for(let prop in detail){
    if(detail_list.indexOf(prop) < 0){
      delete detail[prop];
    }
  }
  dbop_tree.updatePerson(id, detail)
    .then((r)=>{
      res.json({updated_count: r.upsertedCount});
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

app.post("/update_dialog", (req, res)=>{
  identity.isSignin(req)
    .then((usr)=>{
      if(!usr) return;
      var colleName = "usr_" + usr;
      var filterData = {
        talkerId: req.body.talkerId,
        pattern: req.body.old_pat,
        response: req.body.old_res
      };
      return dbop_dialog.resMapUpdate(colleName, filterData, req.body.new_res);
    })
    .then((r)=>{
      res.json({updated_count: r.upsertedCount});
    });
});

app.post("/delete_dialog", (req, res)=>{
  identity.isSignin(req)
    .then((usr)=>{
      if(!usr) return;
      var colleName = "usr_" + usr;
      var filterData = {
        talkerId: req.body.talkerId,
        pattern: req.body.pat,
        response: req.body.res
      };
      return dbop_dialog.resMapDelete(colleName, filterData);
    })
    .then((r)=>{
      res.json({deleted_count: r.deletedCount});
    });
});

// 404
app.use((req,res) => {res.status(404).render('pages/error.ejs', { code: 404 })});

module.exports = app;