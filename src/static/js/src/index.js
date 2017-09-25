// https://github.com/js-cookie/js-cookie
var token = Cookies.get("token");
console.log("YOUR COOKIE");
console.log(token);

jQuery.easing["jswing"] = jQuery.easing["swing"];
jQuery.extend(jQuery.easing, {
  easeOutCubic: function (x, t, b, c, d){
    return c*((t=t/d-1)*t*t + 1) + b;
  }
});

var boardUrl     = "";
var threadUrl    = "";
var threadId     = null;
var socket       = io();
var navLocation  = 1;
var fadeSpeed    = 300;
var fadeDistance = 150;

function SignUp(){
  var name = $("#name").val();
  $.post("sign-up", {name: name}, function(data){
    console.log(data);
  });
}

function Login(){
  var name = $("#name2").val();
  $.post("login", {name: name}, function(data){
    if(data["err"] === 0){
      Cookies.set("name", name);
      Cookies.set("token", data["msg"]);
    }else{
      console.log(data);
    }
  });
}

function Logout(){
  $.post("logout", {token: "TBA"}, function(data){
    Cookies.remove("token");
    console.log(data);
  });
}

function Post(){
  var obj = {
    "name": Cookies.get("name"),
    "token": Cookies.get("token"),
    "data": $("#message").val()
  };
  socket.emit("post", obj);
}

socket.on("post", function(msg){
  console.log(msg);
  var html = `<div class="post">${msg}</div>`;
  $("#msg-box").append(html);
});

socket.on("bad-auth", function(msg){
  alert(msg);
});

socket.on("start-fetch-boards", function(msg){
  $("#content").attr("type", "board-index");
  $("#content").html(msg);
});

socket.on("start-fetch-threads", function(msg){
  $("#content").attr("type", "threads");
  $("#content").html(msg);
});

socket.on("start-fetch-posts", function(msg){
  $("#content").attr("type", "posts");
  $("#content").html(msg);
});

function PageFlip(msg, direction, contentType){
  var temp1, temp2;

  if(direction == "next"){
    temp1 = `+=${fadeDistance}`;
    temp2 = `-=${fadeDistance}`;
  }else if(direction == "prev"){
    temp1 = `-=${fadeDistance}`;
    temp2 = `+=${fadeDistance}`;
  }else{
    alert(`The "direction" variable for PageFlip must be either "next" or "prev"`);
    return;
  }

  $("#content-leaving").attr("id", "content-arriving");
  $("#content").attr("id", "content-leaving");
  $("#content-arriving").html(msg);
  $("#content-arriving").css("display", "block");
  $("#content-arriving").css("left", temp1);
  $("#content-arriving").attr("type", contentType);

  $("#content-leaving").animate({
    opacity: 0,
    left: temp2
  }, fadeSpeed, "easeOutCubic", function(){
    $("#content-leaving").css("display", "none");
    $("#content-leaving").css("left", "0px");
  });

  $("#content-arriving").animate({
    opacity: 1,
    left: temp2
  }, fadeSpeed, "easeOutCubic", function(){
    $("#content-arriving").attr("id", "content");
  });
}

socket.on("fetch-boards", function(msg){
  PageFlip(msg, "prev", "board-index");
  navLocation = 1;
});

socket.on("fetch-threads", function(msg){
  if(navLocation == 1)
    PageFlip(msg, "next", "threads");
  else if(navLocation == 3)
    PageFlip(msg, "prev", "threads");
  navLocation = 2;
});

socket.on("fetch-posts", function(msg){
  PageFlip(msg, "next", "posts");
  navLocation = 3;
});

function BindBoard(){
  $(".board-title").click(function(event){
    var boardId = $(this).attr("board-id");
    boardUrl = $(this).text();
    UpdateUrl();
    socket.emit("fetch-threads", boardId, new Date().getTimezoneOffset());
  });
}

function BindThread(){
  $(".thread-title").click(function(event){
    threadId = $(this).attr("thread-id");
    threadUrl = $(this).text();
    UpdateUrl();
    socket.emit("fetch-posts", threadId, new Date().getTimezoneOffset());
  });

  $(".back").click(function(event){
    boardUrl = "";
    UpdateUrl();
    socket.emit("fetch-boards");
  });
}

function BindPost(){
  $(".back").click(function(event){
    var boardId = $(this).attr("board-id");
    threadUrl = "";
    UpdateUrl();
    socket.emit("fetch-threads", boardId, new Date().getTimezoneOffset());
  });
}

function UpdateUrl(){
  var abc = "/";

  if(boardUrl)
    abc += boardUrl;

  if(threadUrl)
    abc += "/" + threadId + "-" + threadUrl;

  abc = abc.replace(/\s+/g, "-").toLowerCase();

  history.pushState(null, null, abc);
}
