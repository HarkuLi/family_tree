/**
 * database operations for family and person collection in familytree db
 */
const Mongo = require("mongodb"); //for ObjectId()
const dbConnect = require("./db");

const colle_family = "family";
const colle_person = "person";
const colle_mailgroup = "mailgroup";
const colle_mailletter = "mailletter";

/** public function */

var getFamilyByID = (id)=>{
  return getByIDColle(id, colle_family);
};

var getFamilyIDByUsr = (usr)=>{
  return dbConnect.getDb_ft
    .then((db)=>{
      var colle = db.collection(colle_family);
      return colle.findOne({usr}, {_id: 1});
    })
};

var getFamilyByUsr = (usr)=>{
  return dbConnect.getDb_ft
    .then((db)=>{
      var colle = db.collection(colle_family);
      return colle.findOne({usr});
    })
};

var getPersonByID = (id)=>{
  return getByIDColle(id, colle_person);
};

/** data:{name, usr} */
var newFamily = (data)=>{
  data.orderArray = [];
  data.createTime = new Date().getTime();
  return dbConnect.getDb_ft
    .then((db)=>{
      var colle = db.collection(colle_family);
      colle.insertOne(data);
    });
};

var newRoot = (usr, detail)=>{
  var f_colle, p_colle;
  detail.usr = usr;

  return dbConnect.getDb_ft
    .then((db)=>{
      /** add person to database */
      f_colle = db.collection(colle_family);
      p_colle = db.collection(colle_person);
      return p_colle.insertOne(detail);
    })
    .then((rst)=>{
      var id = rst.insertedId.toString();
      var OA = [1, id];
      return f_colle.updateOne(
        {usr},
        {$set: {orderArray: OA}}
      );
    });
}

var addChild = (usr, detail)=>{
  var f_colle, p_colle;
  var id, parent_id;
  var sibling_num_front = 0;
  var children = [];
  var OA;
  detail.usr = usr;

  return dbConnect.getDb_ft
    .then((db)=>{
      f_colle = db.collection(colle_family);
      p_colle = db.collection(colle_person);
      return getFamilyByUsr(usr);
    })
    .then((item)=>{
      OA = item.orderArray;
      return getPersonByID(detail.parents[0]);
    })
    .then((item)=>{
      //check whether the parent is relation by blood in the family
      if(!item.parents && OA.indexOf(item._id.toString())!==1) detail.parents[0] = item.mate;
      /** add person to database */
      return p_colle.insertOne(detail);
    })
    .then((rst)=>{
      id = rst.insertedId.toString();
      return getPersonByID(detail.parents[0]);
    })
    .then((item)=>{
      /** add id in children lists of parents */
      var promise_list = [];
      parent_id = item._id.toString();
      if(item.children){
        sibling_num_front += item.children.length;
        children = item.children;
      }
      children.push(id);
      promise_list.push(
        p_colle.updateOne(
          {_id: item._id},
          {$set: {children}}
        )
      );
      if(item.mate){
        promise_list.push(
          p_colle.updateOne(
            {_id: Mongo.ObjectId(item.mate)},
            {$set: {children}}
          )
        );
      }
      return Promise.all(promise_list);
    })
    .then(()=>{
      return ComputeChildIdx(usr, parent_id);
    })
    .then((child_idx)=>{
      /** modify orderArray */
      addChildToOA(OA, child_idx, id);
      return f_colle.updateOne(
        {usr},
        {
          $set: {orderArray: OA}
        });
    });
};

var remove = (usr, person_id)=>{
  var f_colle, p_colle;
  
  return dbConnect.getDb_ft
    .then((db)=>{
      f_colle = db.collection(colle_family);
      p_colle = db.collection(colle_person);
      return p_colle.findOne({_id: Mongo.ObjectId(person_id)});
    })
    .then((item)=>{
      /** modify children lists of parents */
      var promise_list = []
      if(!item.parents) return;
      for(let parent_id of item.parents)
        promise_list.push(removeChild(parent_id, person_id));
      return Promise.all(promise_list);
    })
    .then(()=>{
      /** delete object of the id */
      return p_colle.remove({_id: Mongo.ObjectId(person_id)});
    })
    .then(()=>{
      return getFamilyByUsr(usr);
    })
    .then((item)=>{
      /** modify orderArray */
      var OA = item.orderArray;
      deletePersonFromOA(OA, person_id);
      return f_colle.updateOne(
        {usr},
        {
          $set: {orderArray: OA}
        });
    });
};

var addMate = (usr, detail)=>{
  var p_colle, f_colle;
  var person_id;
  var OA;
  detail.usr = usr;
  
  return dbConnect.getDb_ft
    .then((db)=>{
      p_colle = db.collection(colle_person);
      f_colle = db.collection(colle_family);
      /** add person to database*/
      return p_colle.insertOne(detail);
    })
    .then((rst)=>{
      /** add mate relation */
      person_id = rst.insertedId.toString();
      return p_colle.updateOne(
        {_id: Mongo.ObjectId(detail.mate)},
        {
          $set: {mate: person_id}
        });
    })
    .then(()=>{
      return getFamilyByUsr(usr);
    })
    .then((item)=>{
      /** modify orderArray */
      OA = item.orderArray;
      addMateToOA(OA, detail.mate, person_id);
      return f_colle.updateOne(
        {usr},
        {
          $set: {orderArray: OA}
        });
    });
};

var removeMate = (usr, person_id)=>{
  var p_colle, f_colle;
  return dbConnect.getDb_ft
    .then((db)=>{
      p_colle = db.collection(colle_person);
      f_colle = db.collection(colle_family);
      return p_colle.findOne({_id: Mongo.ObjectId(person_id)});
    })
    .then((item)=>{
      /** delete mate relation */
      return p_colle.updateOne(
        {_id: Mongo.ObjectId(item.mate)},
        {$unset: {mate: ""}}
      );
    })
    .then(()=>{
      /** delete person from database */
      return p_colle.remove({_id: Mongo.ObjectId(person_id)});
    })
    .then(()=>{
      return getFamilyByUsr(usr);
    })
    .then((item)=>{
      /** modify orderArray */
      OA = item.orderArray;
      deletePersonFromOA(OA, person_id);
      return f_colle.updateOne(
        {usr},
        {
          $set: {orderArray: OA}
        });
    });
};

var updatePerson = (id, data)=>{
  return dbConnect.getDb_ft
    .then((db)=>{
      var colle = db.collection(colle_person);
      return colle.updateOne(
        {_id: Mongo.ObjectId(id)},
        {$set: data}
      );
    });
};

/**
 * Warning: this method will delete all person details of the family
 * deleted: all person details in the orderArray (includes dialogs)
 * orderArray will become an empty array
 * @param {String} usr user name
 */
var dropFamily = (usr)=>{
  var colleName = "usr_" + usr;
  var f_colle, p_colle, mg_colle, ml_colle;
  var final_rst = true;

  return dbConnect.getDb_ft
    .then(db => {
      f_colle = db.collection(colle_family);
      p_colle = db.collection(colle_person);
      mg_colle = db.collection(colle_mailgroup);
      ml_colle = db.collection(colle_mailletter);
      //clean orderArray
      return f_colle.updateOne({usr}, {$set: {orderArray: []}});
    })
    .then(r => {
      if(!r || !r.matchedCount) return final_rst = false;
      //delete all people
      return p_colle.deleteMany({usr});
    })
    .then(r => {
      if(!r) return final_rst = false;
      //delete all people
      return mg_colle.deleteMany({usr});
    })
    .then(r => {
      if(!r) return final_rst = false;
      //delete all people
      return ml_colle.deleteMany({usr});
    })
    .then(r => {
      //if(!r) return false;
      if(!r) return final_rst = false;
      return dbConnect.getDb_lb;
    })
    .then(db => {
      if(!db) return false;
      //drop the dialog colleciton
      var dialogColle = db.collection(colleName);
      return dialogColle.drop();
    })
    .catch((err) => {
      console.log(err);
      return true;
    })
    .then(r => {
      if(!r) return false;
      return final_rst;
    });
};
/** public function */

/** private function */
var getByIDColle = (id, colle_name)=>{
  return dbConnect.getDb_ft
    .then((db)=>{
      var colle = db.collection(colle_name);
      return colle.findOne({_id: Mongo.ObjectId(id)});
    });
};

var removeChild = (parent_id, child_id)=>{
  var colle;
  return dbConnect.getDb_ft
    .then((db)=>{
      colle = db.collection(colle_person);
      return colle.findOne({_id: Mongo.ObjectId(parent_id)});
    })
    .then((item)=>{
      var children = item.children;
      var child_idx = children.indexOf(child_id);
      var update_content;
      children.splice(child_idx, 1);
      if(children.length) update_content = {$set: {children}};
      else update_content = {$unset: {children: ""}};
      return colle.updateOne({_id: Mongo.ObjectId(parent_id)}, update_content);
    });
};

/**
 * OA: orderArray
 * complexity=O(n)
 * Note: it modifies OA
 */
var deletePersonFromOA = (OA, person_id)=>{
  var idx = OA.indexOf(person_id);
  OA.splice(idx, 1);
  for(let i=idx-1; i>=0; --i){
    if(typeof(OA[i]) === "number"){
      --OA[i];
      if(!OA[i])  OA.pop();
      break;
    }
  }
};

/**
 * OA: orderArray
 * complexity=O(n)
 * Note: it modifies OA
 */
var addChildToOA = (OA, idx, id)=>{
  if(idx > OA.length){
    OA[idx-1] = 1;
    OA[idx] = id;
  }
  else{
    for(let i=idx-1; i>=0; --i){
      if(typeof(OA[i])==="number"){
        ++OA[i];
        break;
      }
    }
    OA.splice(idx, 0, id);
  }
};

/**
 * OA: orderArray
 * complexity=O(n)
 * Note: it modifies OA
 */
var addMateToOA = (OA, target_id, added_id)=>{
  var idx = OA.indexOf(target_id);
  for(let i=idx; i>=0; --i){
    if(typeof(OA[i])==="number"){
      ++OA[i];
      break;
    }
  }
  OA.splice(idx+1, 0, added_id);
};

/**
 * used to compute new child index of the parent
 * should be called after the child is added to his/her parents' children lists
 */
var ComputeChildIdx = (usr, parent_id)=>{
  var p_colle;
  var OA;
  var parent_idx, child_idx;
  return dbConnect.getDb_ft
    .then((db)=>{
      p_colle = db.collection(colle_person);
      // f_colle = db.collection(colle_family);
      return getFamilyByUsr(usr);
    })
    .then((item)=>{
      var promise_chain = new Promise((resolve)=>{resolve(0)});
      OA = item.orderArray;
      parent_idx = OA.indexOf(parent_id);

      //find out first child who are right to the inserted child
      for(let i=parent_idx+1; i<OA.length && typeof(OA[i])!="number"; ++i){
        promise_chain = promise_chain
          .then((rst)=>{
            if(rst) return 1;
            return getPersonByID(OA[i]);
          })
          .then((item)=>{
            if(item === 1) return 1;
            else if(item.parents && item.children){
              child_idx = OA.indexOf(item.children[0]);
              return 1;
            }
            return 0;
          });
      }
      return promise_chain;
    })
    .then((rst)=>{
      if(!rst){
        let g_count = 0;
        //find out the last position of the inserted generation
        for(child_idx=parent_idx+1; child_idx<OA.length; ++child_idx){
          if(typeof(OA[child_idx])==="number"){
            ++g_count;
            if(g_count>=2) break;
          }
        }
        //if g_count===1, there is no generation after the inserted generation
        if(!g_count)  ++child_idx;  //there is no one in the inserted generation
      }
      return child_idx;
    });
};
/** private function */

module.exports = {getFamilyByID, getFamilyByUsr, getPersonByID, getFamilyIDByUsr, newFamily, 
                  newRoot, addChild, remove, addMate, removeMate, updatePerson, dropFamily};