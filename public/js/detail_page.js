const boolPropList = ["dialogEnable", "live"];

var dialog_edit_count = 0;
var detail;
var id;
var old_pat, old_res;
var current_page = 1;
var pat_filter = "";  //be changed while clicking search
var res_filter = "";

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

  //delete a dialog
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

  $("#filter_search").on("click", function(){
    pat_filter = $(this).prev().prev().prop("value");
    res_filter = $(this).prev().prop("value");
    current_page = 1;
    selectPage(current_page);
  });

  $("#last_page").on("click", () => {
    lastPage();
  });

  $("#next_page").on("click", () => {
    nextPage();
  });

  $("#paging_row").on("click", ".paging_btn", function(){
    var page = Number($(this).text());
    var self = this;
    selectPage(page, self);
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

/**
 * @param {Object} update_data data to update
 * @return {Object} {rst: Boolean}
 */
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
    if(typeof(rst) !== "boolean") return selectPage(current_page); //reload
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
      selectPage(current_page);
      // //remove elements of the row
      // $(self).prevUntil("br").remove();
      // $(self).next().remove();
      // $(self).remove();
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
      resolve(data);
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
};

var lastPage = () => {
  if(current_page === 1)  return;

  var page = --current_page;
  var filter = {};
  if(pat_filter.length) filter.pattern = pat_filter;
  if(res_filter.length) filter.pattern = res_filter;

  $("body").css("cursor", "progress");
  //clear dialogs
  $("#dialog_list").empty();

  getDialog(page, filter)
    .then(rst =>{
      resetDialogEdit();
      renderDialog(rst.dialog_list);
      changePagingBtn(rst.total_page);
      $("body").css("cursor", "");
    });
};

var nextPage = () => {
  var page = ++current_page;
  var filter = {};
  if(pat_filter.length) filter.pattern = pat_filter;
  if(res_filter.length) filter.pattern = res_filter;

  $("body").css("cursor", "progress");
  //clear dialogs
  $("#dialog_list").empty();

  getDialog(page, filter)
    .then(rst =>{
      if(rst.total_page < current_page) current_page = rst.total_page;
      resetDialogEdit();
      renderDialog(rst.dialog_list);
      changePagingBtn(rst.total_page);
      $("body").css("cursor", "");
    });
};

/**
 * can called with current_page for reload
 * @param {Number} page the page want to load
 * @param {Object} self not required, copy of this
 */
var selectPage = (page, self) => {
  if(self && Number($(self).text())===current_page) return;
  var filter = {};

  current_page = page;
  if(pat_filter.length) filter.pattern = pat_filter;
  if(res_filter.length) filter.response = res_filter;

  $("body").css("cursor", "progress");
  //clear dialogs
  $("#dialog_list").empty();

  getDialog(page, filter)
    .then(rst =>{
      if(rst.total_page < current_page) current_page = rst.total_page;
      resetDialogEdit();
      renderDialog(rst.dialog_list);
      changePagingBtn(rst.total_page);
      $("body").css("cursor", "");
    });
};

var resetDialogEdit = () => {
  old_pat = "";
  old_res = "";
  dialog_edit_count = 0;
};

/**
 * append dialogs to #dialog_list and set filter view
 * @param {Array<Object>} list [{pattern, response},{..},...]
 */
var renderDialog = (list) => {
  setFilterView();
  for(let ele of list){
    var textarea, button;
    $("#dialog_list").append("<strong>pattern: </strong>");
    textarea = $("<textarea></textarea>");
    $(textarea).prop("rows", 1);
    $(textarea).prop("class", "input_ele");
    $(textarea).text(ele.pattern);
    $(textarea).prop("disabled", true);
    $("#dialog_list").append(textarea);
    $("#dialog_list").append(" ");
    $("#dialog_list").append("<strong>response: </strong>");
    textarea = $("<textarea></textarea>");
    $(textarea).prop("rows", 1);
    $(textarea).prop("class", "input_ele");
    $(textarea).text(ele.response);
    $(textarea).prop("disabled", true);
    $("#dialog_list").append(textarea);
    $("#dialog_list").append(" ");
    button = $("<button></button>");
    $(button).prop("type", "button");
    $(button).prop("class", "btn btn-primary btn-sm");
    $(button).text("edit");
    $("#dialog_list").append(button);
    $("#dialog_list").append(" ");
    button = $("<button></button>");
    $(button).prop("type", "button");
    $(button).prop("class", "btn btn-danger btn-sm");
    $(button).text("delete");
    $("#dialog_list").append(button);
    $("#dialog_list").append("<br>");
  }
};

var changePagingBtn = (total_page) => {
  //max: 5 buttons
  var min_page, max_page;
  var page_num, num_diff;

  //determine the bound of page number on the buttons
  if(current_page+2 > total_page){
    max_page = total_page;
    min_page = max_page-4 <= 1 ? 1 : max_page-4;
  }
  else if(current_page-2 < 1){
    min_page = 1;
    max_page = min_page+4 >= total_page ? total_page : min_page+4;
  }
  else{
    min_page = current_page - 2;
    max_page = current_page +2;
  }
  page_num = max_page - min_page + 1;

  //check the number of buttons
  num_diff = page_num - $(".paging_btn").length;
  if(num_diff > 0){
    for(let i=0; i<num_diff; ++i){
      let button = $("<button></button>");
      $(button).prop("type", "button")
      $(button).prop("class", "paging_btn")
      $("#next_page").before(button);
      $("#next_page").before(" ");
    }
  }
  else if(num_diff < 0){
    for(let i=0; i<-num_diff; ++i){
      $("#next_page").prev().remove();
    }
  }

  //change the contents of buttons
  var page_dig = min_page;
  for(let ele of $(".paging_btn")){
    $(ele).text(page_dig);
    if(page_dig === current_page){
      $(ele).prop("class", "btn btn-primary btn-sm paging_btn");
    }
    else{
      $(ele).prop("class", "btn btn-default btn-sm paging_btn");
    }
    ++page_dig;
  }
};

var getDialog = (page, filter) => {
  var passed_data = {
    id,
    page,
    filter
  };
  return new Promise((resolve, reject)=>{
    $.post("/tree/dialog", passed_data, (data, status)=>{
      if(status !== "success")  return reject("post status: "+status);
      resolve(data);
    });
  });
};

var setFilterView = () => {
  $("#pat_filter").prop("value", pat_filter);
  $("#res_filter").prop("value", res_filter);
};