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
  //$('#autoSendField').removeClass('hidden');
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
  let sendData = getFormSendData("#putMail");
  sendData = JSON.parse(sendData);
  sendData.context = $('#summernote').summernote('code');
  sendData.autoSend = (sendData.autoSend === 'on') ? true : false;

  // check send now and no to
  if(!sendData.to && !sendData.autoSend){
    alert('In the "Send Now" mode, please fill the "To" field.');
    return;
  }

  let fgUrl = $("[name='fgUrl']").val();
  let lid = $("[name='lid']").val() || null;

  console.log(sendData);
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
        data: JSON.stringify(obj.sendData),
        async: true,
        //dataType: 'json',
        success: (response, status, xhr) => {
          alert('Send/save mail success!');
          //console.log(response);
          window.location.assign(`${window.location.origin}${fgUrl}/mail/ml/`);
        },
        error: (xhr, status, error) => {
          alert('Send/save mail error!');
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
  let lid = $("[name='lid']").val() || null;
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
      window.location.assign(`${window.location.origin}${window.location.pathname}/edit/${lid}`);
      break;
    case 'success':
    case 'fail':
      window.location.assign(`${window.location.origin}${window.location.pathname}/show/${lid}`);
      break;
    default: 
      console.log("[event] unknown status");
      return;
  }
});

//TAG: e-mg-menu operation
$(".emaillist").click(function(e){
  stopActionAndBubbling(e);
  let added = $(this).html().replace('&lt;', '<').replace('&gt;', '>');
  let field = $(this).parent().parent().parent().prev();
  let tmp = field.val();
  (!tmp) ? field.val(added) : field.val(tmp+', '+added);
});
$(".dropdown-toggle").focus(function (e) {
  $(".dropdown").removeClass("open");
  $(this).siblings(".dropdown").addClass("open");
});
$(".dropdown-toggle").blur(function(e){
  // INFO: because blur prior to click event, deffer blur cb.
  setTimeout(() => {$(this).siblings(".dropdown").removeClass("open");}, 200);
});