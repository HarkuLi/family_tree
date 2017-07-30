/* TAG: initialize summernote editor */
function initSummerNote(){
  $('#summernote').summernote({
    minHeight: 270,             // set minimum height of editor
    maxHeight: null,             // set maximum height of editor
    focus: false,                  // set focus to editable area after initializing summernote
    dialogsInBody: true
  });

  // if lid exist, get the content
  let fgUrl = $("[name='fgUrl']").val() || null;
  let lid = $("[name='lid']").val() || null;
  if(lid && fgUrl){
    $.get(`${fgUrl}/mail/ml/fn/${lid}`, {}, (mailContent, status) => {
      console.log(mailContent);
      if(mailContent.status){  
        $('#summernote').summernote('code', mailContent.data.context);  
        let editable = $("[name='editable']").val() || false;
        if(!editable || editable ==='false'){
          console.log("disable editor");
          $('#summernote').summernote('disable');
        }
        return;
      }
      console.log(`get mail content with lid = ${lid} got error.`);
    });
  }
}

/* TAG: initialize datepicler */
function initDateTimePicker(){
  $('#datetimepicker').datetimepicker({
    format: "yyyy-mm-dd hh:ii",
      autoclose: true,
      clearBtn: true,
      minuteStep: 10
  });
}

//-------------------------------------------------------

// initialize
$(document).ready(() => {
  initSummerNote();
  initDateTimePicker();
});

// TAG: switch to display auto send time field
$('#myonoffswitch').change(function() {
  if(this.checked){
    $('#autoSendField').removeClass('hidden');
  }else{
    $('#autoSendField').addClass('hidden');
    $('#datetimepicker').val('');
  }
});

// TAG: for save and send mail
$("#putMail").submit((e) => {    
  stopActionAndBubbling(e);

  // get data from form
  let sendData = getFormData("#putMail");
  sendData.push({ context: $('#summernote').summernote('code') });

  // check autosend field
  sendData.autoSend = (sendData.autoSend === 'on') ? true : false;

  let fgUrl = $("[name='fgUrl']").val();
  let lid = $("[name='lid").val() || null;

  // send to server
  Promise.resolve(sendData)
    .then((sendData) => {
      let sendUrl = window.location.origin + fgUrl + '/mail/ml/edit/';
      (lid) ? sendUrl += lid : null;

      if(!fgUrl) return Promise.reject("cannot find fgUrl");
      return Promise.resolve({ sendData, sendUrl });
    })
    .then((obj) => {
      console.log(obj);
      $.ajax({
        url: obj.sendUrl,
        type: 'PUT',
        contentType: 'application/json',
        data: obj.sendData,
        async: true,
        //dataType: 'json',
        success: (response, status, xhr) => {
          alert('Send mail success!');
          //console.log(response);
          window.location.assign(`${window.location.origin}${fgUrl}/mail/ml/`);
        },
        error: (xhr, status, error) => {
          alert('Send mail error!');
          console.log(error);
          return Promise.reject(error);
        }
      });
    })
    .catch((err) => console.log(err));
})

// TAG: for delete mail
$('#deleteMail').click((e) => {
  stopActionAndBubbling(e);

  let fgUrl = $("[name='fgUrl']").val();
  let lid = $("[name='lid").val() || null;
  if(!lid){
    alert("delete mail failed");
    return console.log("[event] empty lid");
  }
  
  $.ajax({
    url: `${window.location.origin}${fgUrl}/mail/ml/del/${lid}`,
    type: 'DELETE',
    contentType: 'application/json',
    success: (response, status, xhr) => {
      alert('delete mail success!');
      console.log(response);
      window.location.assign(`${window.location.origin}${fgUrl}/mail/ml/`);
    },
    error: (xhr, status, error) => {
      alert('delete mail error!');
      console.log(error);
    }
  });
})

// TAG: mail letter list row link
$(".mail-letter-list").click(function() {
  let lid = $(this).children("[name='lid']").val() || null;
  let status = $(this).children("[name='status']").val() || null;
  console.log({lid, status});
  if(!lid || !status) return console.log("[event] lid or status invalid");
  switch(status){
    case 'draft':
    case 'pending':
      window.location.assign(`${window.location.origin}${window.location.pathname}edit/${lid}`);
      break;
    case 'success':
    case 'fail':
      window.location.assign(`${window.location.origin}${window.location.pathname}show/${lid}`);
      break;
    default: 
      console.log("[event] unknown status");
      return;
  }
});