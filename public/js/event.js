$(document).ready(() => {
  initSummerNote();
  initDateTimePicker();
});


/* Loading EJS Template */
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

/* initialize summernote editor */
function initSummerNote(){
  $('#summernote').summernote({
    minHeight: 270,             // set minimum height of editor
    maxHeight: null,             // set maximum height of editor
    focus: false,                  // set focus to editable area after initializing summernote
    dialogsInBody: true
  });
}

/* initialize datepicler */
function initDateTimePicker(){
  $('#datetimepicker').datetimepicker({
    format: "yyyy-mm-dd hh:ii",
      autoclose: true,
      clearBtn: true,
      minuteStep: 10
  });

}

// switch to display auto send time field
$('#myonoffswitch').change(function() {
  if(this.checked){
    $('#autoSendField').removeClass('hidden');
  }else{
    $('#autoSendField').addClass('hidden');
    $('#datetimepicker').val('');
  }
});


// switch to signin or signup
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

// mask show, signin show
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

// get QR Code
$("#get-qrcode").click((e) => {
  let test_fgid = '6a736e667061693132396664';

  // cancel a event bubling
  e.stopPropagation();
  e.preventDefault();

  $("#popup-content").html("");
  $(".mask").removeClass('hidden');
  $(".wrapper").removeClass('hidden');
  $("#async-load").removeClass('hidden');

  loadTemplate("/mask/qrcode", { fgid: test_fgid })
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

// for save and send mail
$('#putMail').click((e) => {
  

  let getFormData = function(){
    var Def = new $.Deferred();
    $("form").submit((sub) => {
      sub.preventDefault();
      sub.stopPropagation();
      let sendData = $("form").serializeArray();
      console.log(sendData);
      (sendData.length > 0) ? Def.resolve(sendData) : Def.reject(sendData);
    });
    return Def.promise();
  };

  console.log(getFormData);

  getFormData
    .then((sendData) => {
      let fgUrl = $("[name='fgUrl']").val();
      let mid = $("[name='mid").val() || null;
      let sendUrl = window.location.origin + fgUrl + '/edit/';
      (mid) ? sendUrl += mid : null;

      if(!fgUrl) return Promise.reject("cannot find fgUrl");
      return Promise.resolve({ sendData, sendUrl });
    })
    .then((obj) => {
      $.ajax({
        url: obj.sendUrl,
        type: 'PUT',
        data: JSON.stringify(obj.sendData),
        dataType: 'json',
        success: (status, response) => {
          alert('Send mail success!');
          console.log(response);
        },
        error: (xhr, status, error) => {
          alert('send mail error!');
          return Promise.reject(error);
        }
      });
    })
    .catch((err) => console.log(err));
})