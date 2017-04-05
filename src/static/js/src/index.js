// https://github.com/js-cookie/js-cookie
var token = Cookies.get("token");
console.log("YOUR COOKIE");
console.log(token);

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

var socket = io();
var animationLock = false;

socket.on("post", function(msg){
  console.log(msg);
  var html = `<div class="post">${msg}</div>`;
  $("#msg-box").append(html);
});

socket.on("bad-auth", function(msg){
  alert(msg);
});

socket.on("fetch-boards-old", function(msg){
  $("#board-index").html(msg);
  // history.pushState(null, null, msg);
});

var navLocation = 1;

function REEEEEEEEE(){
  if(navLocation === 1){
    // $("#board-index").html("<div style='width:33%'></div>");
    $("#threads").html("<div style='width:33%'></div>");
    $("#posts").html("<div style='width:33%'></div>");
  }else if(navLocation === 2){
    $("#board-index").html("<div style='width:33%'></div>");
    // $("#threads").html("<div style='width:33%'></div>");
    $("#posts").html("<div style='width:33%'></div>");
  }else if(navLocation === 3){
    $("#board-index").html("<div style='width:33%'></div>");
    $("#threads").html("<div style='width:33%'></div>");
    // $("#posts").html("<div style='width:33%'></div>");
  }
  animationLock = false;
}

socket.on("fetch-boards", function(msg){
  $("#board-index").html(msg);
  navLocation = 1;

  $("#forum-container").animate({
    left: "0"
  }, 300, function(){
    REEEEEEEEE(navLocation);
  });
});

socket.on("fetch-threads", function(msg){
  $("#threads").html(msg);
  navLocation = 2;

   $("#forum-container").animate({
    left: "-99%"
  }, 300, function(){
    REEEEEEEEE(navLocation);
  });
});

socket.on("fetch-posts", function(msg){
  $("#posts").html(msg);
  navLocation = 3;

   $("#forum-container").animate({
    left: "-198%"
  }, 300, function(){
    REEEEEEEEE(navLocation);
  });
});

function BindBoard(){
  $(".board-title").click(function(event){
    if(animationLock){
      return;
    }
    animationLock = true;
    var boardId = $(this).attr("board-id");
    // history.pushState(null, null, boardId);
    socket.emit("fetch-threads", boardId, new Date().getTimezoneOffset());
  });
}

function BindThread(){
  $(".thread-title").click(function(event){
    if(animationLock)
      return;
    animationLock = true;
    var threadId = $(this).attr("thread-id");
    // history.pushState(null, null, threadId);
    socket.emit("fetch-posts", threadId, new Date().getTimezoneOffset());
  });

  $(".back").click(function(event){
    if(animationLock)
      return;
    animationLock = true;
    socket.emit("fetch-boards");
  });
}

function BindPost(){
  $(".back").click(function(event){
    if(animationLock)
      return;
    animationLock = true;
    var boardId = $(this).attr("board-id");
    socket.emit("fetch-threads", boardId, new Date().getTimezoneOffset());
  });
}
