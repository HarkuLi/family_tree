// TAG: add or edit group
function putMailGroup(e, mgid){
  stopActionAndBubbling(e);

  // get data from form
  let sendData = getFormSendData("#mg-editor-form");
  let sendUrl = window.location.href+'edit/'+mgid;
  console.log({sendData, sendUrl, mgid});

  sendDataToServer('PUT', sendUrl, sendData)
    .then((response) => {
      if(!response.status) return Promise.reject(response);
      (mgid) ? alert('Edit mail group success!') : alert('Add new mail group success!');
      closePopup();
      window.location.reload();
    })
    .catch((err) => {
      (mgid) ? alert('Edit mail group error!') : alert('Add new mail group error!');
      console.log(err);
      //return Promise.reject(error);
    });
}

// TAG:
function deleteGroup(e, mgid){
  stopActionAndBubbling(e);

  if(!mgid){
    console.log("[deleteGroup] no mgid found");
    return alert("Delete group got error!");
  }
  let sendData = getFormSendData("#mg-editor-form");
  let sendUrl = window.location.href+'del/'+mgid;

  sendDataToServer('DELETE', sendUrl, sendData)
    .then((response) => {
      // {response, status}
      if(!response.status) return Promise.reject(response);
      alert('Delete mail group success!');
      window.location.reload();
    })
    .catch((err) => {
      alert('Delete mail group error!');
      console.log(err);
    });
}

// TAG:
function addGroupMember(e, mgid){
  stopActionAndBubbling(e);

  if(!mgid){
    console.log("[addGroupMember] no mgid found");
    return alert("add member to group got error!");
  }
  let sendData = getFormSendData("#mg-editor-form");
  let sendUrl = window.location.href+mgid+'/adl/add';

  sendDataToServer('PUT', sendUrl, sendData)
    .then((response) => {
      // {response, status}
      if(!response.status) return Promise.reject(response);
      alert('Add new member success!');
      window.location.reload();
    })
    .catch((err) => {
      alert('Add new member error!');
      console.log(error);
    });
}

// TAG: TODO:
function deleteGroupMember(e, mgid, mbid){
  if(!mgid || !mbid){
    console.log("[deleteGroupMember] no mgid or mbid found");
    return alert("Delete group member got error!");
  }
  let sendData = getFormSendData("#mg-editor-form");
  let sendUrl = window.location.href+mgid+'/adl/del/'+mbid;
  sendDataToServer('DELETE', sendUrl, sendData)
    .then((response) => {
      // {response, status}
      if(!response.status) return Promise.reject(response);
      alert('Delete group member success!');
      window.location.reload();
    })
    .catch((err) => {
      alert('Delete group member error!');
      console.log(error);
    });
}


// TAG: add new mail group
$("#add-mg").click((e) => {
  // cancel a event bubling
  stopActionAndBubbling(e);
  showPopup();

  loadTemplate(window.location.pathname+"edit/", {})
    .then((render) => {
      $("#async-load").addClass('hidden');
      $("#popup-content").html(render());
    })
    // bind event: add new group
    .then(() => $("#mg-editor-form").on("submit", (e) => putMailGroup(e, '')))
    .catch((err) => console.log(err)); 
});

// TAG: edit group name
$(".edit-group").on('click', function(e){
  stopActionAndBubbling(e);
  showPopup();

  let mgid = $(this).parent().parent().attr('id') || '';
  console.log(this);
  loadTemplate(window.location.pathname+"edit/"+mgid, {})
    .then((render) => {
      $("#async-load").addClass('hidden');
      $("#popup-content").html(render());
    })
    // bind event: add new group
    .then(() => $("#mg-editor-form").on("submit", (e) => putMailGroup(e, mgid))
    ).catch((err) => console.log(err)); 
});

// TAG: delete current group
$(".delete-group").on('click', function(e){
  let mgid = $(this).parent().parent().attr('id') || '';
  deleteGroup(e, mgid);
});

// TAG: add new email member
$(".add-member").on('click', function(e){
  stopActionAndBubbling(e);
  showPopup();

  let mgid = $(this).parent().parent().attr('id') || '';
  loadTemplate(window.location.pathname+mgid+"/adl/add", {})
    .then((render) => {
      $("#async-load").addClass('hidden');
      $("#popup-content").html(render());
    })
    // bind event: add new group
    .then(() => {
      // send data
      $("#mg-editor-form").on("submit", (e) => addGroupMember(e, mgid));

      // TAG: dropdown display switch
      $(".emaillist").on('click', function(e){
        stopActionAndBubbling(e);
        let pid = $(this).parent().attr('id');
        let text = $(this).html();
        // change selected display
        $('#menu-select').html(text);
        $("[name='addPid']").val(pid);
        // close dropdown
        $('#fgEmailMenu').removeClass('open');
        $('#fgEmailMenu button').attr('aria-expanded', false);
      });

      // TAG: clear selected menu item
      $('.reset-menu').on('click', function(e){
        stopActionAndBubbling(e);
        // change selected display
        $('#menu-select').html('Choose an existed family group member...');
        $("[name='addPid']").val('');
        // close dropdown
        $('#fgEmailMenu').removeClass('open');
        $('#fgEmailMenu button').attr('aria-expanded', false);
      });
    }).catch((err) => console.log(err)); 
});

// TAG: add new email member
$(".delete-member").on('click', function(e){
  stopActionAndBubbling(e);
  let mgid = $(this).parent().parent().parent().parent().parent().attr('id') || '';
  let mbid = $(this).parent().parent().attr('id') || '';
  console.log('mgid = ' + mgid);
  deleteGroupMember(e, mgid, mbid);
});