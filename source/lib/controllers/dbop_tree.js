const Mongo = require('mongodb'); //for ObjectId()
const MongoClient = require('mongodb').MongoClient;

const dbUrl = "mongodb://127.0.0.1:3000/familytree";
const colle_family = 'family';
const colle_person = 'person';

/** public function */
var getDB = MongoClient.connect(dbUrl);

var getFamilyByID = (id)=>{
  return getByIDColle(id, colle_family);
};

var getFamilyByUsr = (usr)=>{
  return getDB
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
  return getDB
    .then((db)=>{
      var colle = db.collection(colle_family);
      colle.insertOne(data);
    });
};

var newRoot = (usr, detail)=>{
  var f_colle, p_colle;
  return getDB
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

var addChild = (family_id, detail)=>{
  var f_colle, p_colle;
  var id, parent_id;
  var sibling_num_front = 0;
  var children = [];
  var OA;
  return getDB
    .then((db)=>{
      f_colle = db.collection(colle_family);
      p_colle = db.collection(colle_person);
      return getFamilyByID(family_id);
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
      return ComputeChildIdx(family_id, parent_id);
    })
    .then((child_idx)=>{
      /** modify orderArray */
      addChildToOA(OA, child_idx, id);
      return f_colle.updateOne(
        {_id: Mongo.ObjectId(family_id)},
        {
          $set: {orderArray: OA}
        });
    });
};

var remove = (family_id, person_id)=>{
  var f_colle, p_colle;
  
  return getDB
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
      return getFamilyByID(family_id);
    })
    .then((item)=>{
      /** modify orderArray */
      var OA = item.orderArray;
      deletePersonFromOA(OA, person_id);
      return f_colle.updateOne(
        {_id: Mongo.ObjectId(family_id)},
        {
          $set: {orderArray: OA}
        });
    });
};

var addMate = (family_id, detail)=>{
  var p_colle, f_colle;
  var person_id;
  var OA;
  
  return getDB
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
      return getFamilyByID(family_id);
    })
    .then((item)=>{
      /** modify orderArray */
      OA = item.orderArray;
      addMateToOA(OA, detail.mate, person_id);
      return f_colle.updateOne(
        {_id: Mongo.ObjectId(family_id)},
        {
          $set: {orderArray: OA}
        });
    });
};

var removeMate = (family_id, person_id)=>{
  var p_colle, f_colle;
  return getDB
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
      return getFamilyByID(family_id);
    })
    .then((item)=>{
      /** modify orderArray */
      OA = item.orderArray;
      deletePersonFromOA(OA, person_id);
      return f_colle.updateOne(
        {_id: Mongo.ObjectId(family_id)},
        {
          $set: {orderArray: OA}
        });
    });
};
/** public function */

/** private function */
var getByIDColle = (id, colle_name)=>{
  return getDB
    .then((db)=>{
      var colle = db.collection(colle_name);
      return colle.findOne({_id: Mongo.ObjectId(id)});
    });
};

var removeChild = (parent_id, child_id)=>{
  var colle;
  return getDB
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
var ComputeChildIdx = (family_id, parent_id)=>{
  var p_colle;
  var OA;
  var parent_idx, child_idx;
  return getDB
    .then((db)=>{
      p_colle = db.collection(colle_person);
      // f_colle = db.collection(colle_family);
      return getFamilyByID(family_id);
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

module.exports = {getFamilyByID, getFamilyByUsr, getPersonByID, newFamily,
                  newRoot, addChild, remove, addMate, removeMate, getDB};