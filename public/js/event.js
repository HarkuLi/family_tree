$(document).ready(() => {
  initSummerNote();
  initDateTimePicker();
});


/* TAG: Loading EJS Template */
function loadTemplate(route, data={}){
  return new Promise((resolve, reject) => {
    if(!route) reject(console.log("No Route Determinate."));

    // get template
    $.get(window.location.origin+route, data, (template, status) => {
      if(status === "error"){
        console.log({data, status});
        reject(console.log("Failed to Load Content."));
      }
      // rendering function with ejs template
      let render = ejs.compile(template, {client: true});
      resolve(render);
    }, "html");
  });
}

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

// TAG: switch to display auto send time field
$('#myonoffswitch').change(function() {
  if(this.checked){
    $('#autoSendField').removeClass('hidden');
  }else{
    $('#autoSendField').addClass('hidden');
    $('#datetimepicker').val('');
  }
});


// TAG: switch to signin or signup
function switchSignTo(e){
  $("form").submit((sub) => sub.preventDefault());
  e.stopPropagation();
  e.preventDefault();

  $("#async-load").removeClass("hidden");
  $("#popup-content").html("");

  let typeSet = {signin: "signin", signup: "signup"};
  if(!e.data.dest || !e.data.from) return console.log("switch input invalid.");
  if( !(e.data.dest in typeSet) || !(e.data.from in typeSet) ) return console.log("unknow switch type.");
  

  loadTemplate(`/mask/${e.data.dest}`)
    .then((render) => {
      $("#async-load").addClass("hidden");
      $("#popup-content").html(render());
    })
    .then(() => {
      // bind event: click
      $("#switch-"+e.data.from).on("click", { dest: e.data.from, from: e.data.dest }, switchSignTo);
    })
    .catch((err) => console.log(err));
}

/* EVENT BLOCKS */

// TAG: mask show, signin show
$("#sign").click(() => {
  $("#popup-content").html("");
  $(".mask").removeClass('hidden');
  $(".wrapper").removeClass('hidden');
  $("#async-load").removeClass('hidden');

  loadTemplate("/mask/signin")
    .then((render) => {
      $("#async-load").addClass("hidden");
      $("#popup-content").html(render());
    })
    .then(() => {
      // bind event: switch to signup
      $("#switch-signup").on("click", { dest: "signup", from: "signin" }, switchSignTo);
    }).catch((err) => console.log(err));
});

// TAG: mask hide when click close
$("#sign_out").click(()=>{
  window.location = "/sign_out";
});

// mask hide when click close
$(".close").click(() => {
  $(".mask").addClass('hidden');
  $(".wrapper").addClass('hidden');
  $("#async-load").addClass("hidden");
  $("#popup-content").html("");
});

// TAG: get QR Code
$("#get-qrcode").click((e) => {
  let test_fgid = '6a736e667061693132396664';

  // cancel a event bubling
  e.stopPropagation();
  e.preventDefault();

  $("#popup-content").html("");
  $(".mask").removeClass('hidden');
  $(".wrapper").removeClass('hidden');
  $("#async-load").removeClass('hidden');

  loadTemplate("/mask/qrcode", { fgid: test_fgid }) //TODO: change to formal fgid
    .then((render) => {
      $("#async-load").addClass('hidden');
      $("#popup-content").html(render());
    })
    .then(() => 
      // bind event: copy short url
      $("#copy-url").on("click", () => {
        $("#short-url").select();
        document.execCommand("copy");
        $("#copy-url button").html("Copied");
        $(".info-text").html("Copied to Clipboard!");
      })
    ).catch((err) => console.log(err));
});

// TAG: for save and send mail
$("#putMail").submit((e) => {    
  e.preventDefault();
  e.stopPropagation();

  // get data from form
  let sendData = $("#putMail").serializeArray();
  sendData.push({
    name: 'context',
    value: $('#summernote').summernote('code')
  });
  
  // process Array [{name: xxx, value: xxx}] to json
  let tmp = {};
  sendData.forEach((nv) => tmp[nv.name] = nv.value);
  sendData = JSON.stringify(tmp);

  // check autosend field
  sendData.autoSend = (sendData.autoSend === 'on') ? true : false;
  console.log(sendData);

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
          console.log()
          window.location.assign(`${window.location.origin}${fgUrl}/mail/ml/`);
        },
        error: (xhr, status, error) => {
          alert('send mail error!');
          console.log(error);
          return Promise.reject(error);
        }
      });
    })
    .catch((err) => console.log(err));
})
// TAG: for delete mail
$('#deleteMail').click((e) => {
  e.preventDefault();
  e.stopPropagation();

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