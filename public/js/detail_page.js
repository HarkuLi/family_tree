var dialog_edit_count = 0;
var detail;
var id;
var old_pat, old_res;
var boolPropList = ["dialogEnable", "live"];

////////////////////
//ready
////////////////////

$(()=>{
  ////////////////////
  //record details
  ////////////////////
  detail = {};
  for(let ele of $("#node_detail > p")){
    let prop = $(ele).children().text();
    let value;
    prop = prop.substr(0, prop.length-2);
    //nodeType: https://www.w3schools.com/jsref/prop_node_nodetype.asp
    value = $(ele).contents().filter(function(){ 
      return this.nodeType === 3;
    })[0];
    value = value ? value.nodeValue : "";
    //boolean prop
    if(boolPropList.indexOf(prop) >= 0)
      value = value === "true" ? true : false;
    detail[prop] = value;
  }
  id = $("#detail_id").val();
  $("#detail_id").remove();

  ////////////////////
  //click listener
  ////////////////////
  $("#edit_detail").on("click", ()=>{
    if($("#edit_detail").text() === "edit")
      convertToEditMod();
    else
      endEdit();
  });

  //couldn't use arrow function here, or "this" will point to window object
  //because "this" is fixed when arrow function declared
  $("#dialog_list").on("click", ".btn-primary", function(){
    var self = this;
    if($(self).text() === "edit"){
      if(dialog_edit_count)  return alert("請先結束進行中的編輯");
      dialogEdit(self);
    }
    else if($(self).text() === "save"){
      if(dialog_edit_count !== 1) return;
      dialogSave(self);
    }
  });

  //couldn't use arrow function here, or "this" will point to window object
  //because "this" is fixed when arrow function declared
  $("#dialog_list").on("click", ".btn-danger", function(){
    var self = this;
    if(dialog_edit_count) return alert("請先結束進行中的編輯");
    dialogDel(self);
  });

  $("#add_dialog").on("click", () => {
    if(dialog_edit_count) return alert("請先結束進行中的編輯");
    addDialog();
  });
});

////////////////////
//functions
////////////////////

  ////////////////////
  //detail
  ////////////////////

var convertToEditMod = ()=>{
  $("#edit_detail").text("save");

  //remove contents
  $("#node_detail > p").remove();
  
  //create inputs according to details
  for(let prop in detail){
    let title = $("<strong></strong>");
    let input = $("<input></input>");
    
    $(title).text(prop+": ");
    $(input).attr("name", prop);
    if(boolPropList.indexOf(prop) < 0){
      if(prop === "birth")  $(input).attr("type", "date");
      else $(input).attr("type", "text");
      $(input).attr("value", detail[prop]);
    }
    else{
      $(input).attr("type", "checkbox");
      $(input).prop("checked", detail[prop]);
    }
    $("#node_detail").append(title);
    $("#node_detail").append(input);
    $("#node_detail").append("<br>");
  }
};

var endEdit = ()=>{
  var prop = [];
  var value = [];
  var modified = false;
  var udata = {};

  $("#edit_detail").text("edit");
  if(!detail) return;

  //record inputs
  for(let ele of $("#node_detail > strong")){
    let new_prop = $(ele).text();
    new_prop = new_prop.substr(0, new_prop.length-2);
    prop.push(new_prop);
  }
  for(let ele of $("#node_detail > input")){
    if(boolPropList.indexOf($(ele).prop("name")) < 0){
      value.push($(ele).val());
      continue;
    }
    value.push($(ele).prop("checked"));
  }

  //compare with original data
  for(let i=0; i<prop.length; ++i){
    if(value[i] !== detail[prop[i]]){
      detail[prop[i]] = value[i];
      udata[prop[i]] = value[i];
      modified = true;
    }
  }

  //update database when modified
  new Promise((resolve)=>{
    if(!modified) resolve(false);
    else  resolve(updatePerson(udata));
  })
  .then(()=>{
    //remove inputs
    $("#node_detail > strong").remove();
    $("#node_detail > input").remove();
    $("#node_detail > br").remove();
    
    //create contents according to details
    $("#node_detail").append("<br>");
    for(let prop in detail){
      let p = $("<p></p>");
      let strong = $("<strong></strong>");

      $(strong).text(prop+": ");
      $(p).append(strong);
      if(boolPropList.indexOf(prop) < 0)
        $(p).append(detail[prop]);
      else  
        $(p).append(String(detail[prop]));
      $("#node_detail").append(p);
    }
  });
};

/** return: {rst: Boolean} */
var updatePerson = (update_data)=>{
  update_data._id = id;
  return new Promise((resolve, reject)=>{
    $.post("/tree/update_person", update_data, (data, status)=>{
      if(status !== "success")  return reject("post status: "+status);
      resolve(data);
    });
  });
};

  ////////////////////
  //dialog
  ////////////////////

var dialogEdit = (self) => {
  var res = $(self).prev();
  var pat = $(res).prev().prev();

  old_pat = $(pat).prop("value");
  old_res = $(res).prop("value");

  $(res).prop("disabled", false);
  $(self).text("save");
  ++dialog_edit_count;
};

var dialogSave = (self) => {
  var res = $(self).prev();
  var pat = $(res).prev().prev();
  var new_pat = $(pat).prop("value");
  var new_res = $(res).prop("value");

  new Promise(resolve => {
    if(!new_pat.length || !new_res.length){
      //add an empty dialog and save
      if(!old_pat.length && !old_res.length)  resolve(false);
      //edited with empty new value
      else{
        //nothing modified
        $(pat).prop("value", old_pat);
        $(res).prop("value", old_res);
        resolve(true);
      }
    }
    else if(new_pat === old_pat && new_res === old_res) resolve(true); //nothing modified
    else resolve(upsertDbDialog(new_pat, new_res));
  })
  .then((rst) => {
    --dialog_edit_count;
    if(rst){
      $(pat).prop("disabled", true);
      $(res).prop("disabled", true);
      $(self).text("edit");
    }
    else{
      $(self).prevUntil("br").remove();
      $(self).nextUntil("strong").remove();
      $(self).remove();
    }
  });
};

var dialogDel = (self) => {
  if(!confirm("確定要刪除嗎?")) return;
  var res = $(self).prev().prev();
  var pat = $(res).prev().prev();
  
  deleteDbDialog($(pat).prop("value"), $(res).prop("value"))
    .then(() => {
      //remove elements of the row
      $(self).prevUntil("br").remove();
      $(self).next().remove();
      $(self).remove();
    });
};

var addDialog = () => {
  var textarea, button;
  $("#dialog_list").prepend("<br>");
  button = $("<button></button>");
  $(button).prop("type", "button");
  $(button).prop("class", "btn btn-danger btn-sm");
  $(button).text("delete");
  $("#dialog_list").prepend(button);
  $("#dialog_list").prepend(" ");
  button = $("<button></button>");
  $(button).prop("type", "button");
  $(button).prop("class", "btn btn-primary btn-sm");
  $(button).text("save");
  $("#dialog_list").prepend(button);
  $("#dialog_list").prepend(" ");
  textarea = $("<textarea></textarea>");
  $(textarea).prop("rows", 1);
  $(textarea).prop("class", "input_ele");
  $("#dialog_list").prepend(textarea);
  $("#dialog_list").prepend("<strong>response: </strong>");
  $("#dialog_list").prepend(" ");
  textarea = $("<textarea></textarea>");
  $(textarea).prop("rows", 1);
  $(textarea).prop("class", "input_ele");
  $("#dialog_list").prepend(textarea);
  $("#dialog_list").prepend("<strong>pattern: </strong>");
  old_pat = "";
  old_res = "";
  ++dialog_edit_count;
}

var upsertDbDialog = (new_pat, new_res) => {
  var passed_data = {
    talkerId: id,
    old_pat,
    old_res,
    new_pat,
    new_res
  };

  return new Promise((resolve, reject)=>{
    $.post("/tree/upsert_dialog", passed_data, (data, status)=>{
      if(status !== "success")  return reject("post status: "+status);
      resolve(data.rst);
    });
  });
};

var deleteDbDialog = (pat, res) => {
  var passed_data = {
    talkerId: id,
    pat,
    res
  };

  return new Promise((resolve, reject)=>{
    $.post("/tree/delete_dialog", passed_data, (data, status)=>{
      if(status !== "success")  return reject("post status: "+status);
      resolve(data);
    });
  });
}