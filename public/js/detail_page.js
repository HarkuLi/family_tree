$(()=>{ //ready
  var detail;
  var id;

  //record details
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
    detail[prop] = value;
  }
  id = $("#node_detail > input").val();

  $("#edit_detail").click(()=>{
    if($("#edit_detail").text() === "edit")
      convertToEditMod();
    else
      endEdit();
  });

  var convertToEditMod = ()=>{
    $("#edit_detail").text("save");

    //remove contents
    $("#node_detail > p").remove();
    
    //create inputs according to details
    for(let prop in detail){
      let title = $("<strong></strong>");
      let input = $("<input></input>");
      $(title).text(prop+": ");
      $(input).attr("type", "text");
      $(input).attr("name", prop);
      $(input).attr("value", detail[prop]);
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
    for(let ele of $("#node_detail > :text"))
      value.push($(ele).val());

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
      else  resolve(updateData(id, udata));
    })
    .then(()=>{
      //remove inputs
      $("#node_detail > strong").remove();
      $("#node_detail > :text").remove();
      $("#node_detail > br").remove();
      
      //create contents according to details
      $("#node_detail").append("<br>");
      for(let prop in detail){
        let p = $("<p></p>");
        let strong = $("<strong></strong>");
        $(strong).text(prop+": ");
        $(p).append(strong);
        $(p).append(detail[prop]);
        $("#node_detail").append(p);
      }
    });
  };

  /** return: {update_count} */
  var updateData = (id, update_data)=>{
    update_data._id = id;
    return new Promise((resolve, reject)=>{
      $.post("/tree/update_person", update_data, (data, status)=>{
        if(status !== "success")  return reject("post status: "+status);
        resolve(data);
      });
    });
  };
});