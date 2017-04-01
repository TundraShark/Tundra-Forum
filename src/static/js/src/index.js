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

socket.on("fetch-boards", function(msg){
  $("#board-index").html(msg);

  $("#forum-container").animate({
    left: "+=810"
  }, 300);

  // history.pushState(null, null, msg);
});

socket.on("fetch-threads", function(msg){
  // Determine if we're currently on Boards or Posts
  // and move the interface left or right accordingly
  $("#threads").html(msg);

   $("#forum-container").animate({
    left: "-=810"
  }, 300);

  // history.pushState(null, null, msg);
});

socket.on("fetch-threads-2", function(msg){
  // Determine if we're currently on Boards or Posts
  // and move the interface left or right accordingly
  $("#threads").html(msg);

   $("#forum-container").animate({
    left: "+=810"
  }, 300);

  // history.pushState(null, null, msg);
});

socket.on("fetch-posts", function(msg){
  $("#posts").html(msg);

   $("#forum-container").animate({
    left: "-=810"
  }, 300);

  // history.pushState(null, null, msg);
});

function BindBoard(){
  $(".board").click(function(event){
    var boardId = $(this).attr("board-id");
    socket.emit("fetch-threads", boardId, new Date().getTimezoneOffset());
  });
}

function BindThread(){
  $(".thread").click(function(event){
    var threadId = $(this).attr("thread-id");
    socket.emit("fetch-posts", threadId, new Date().getTimezoneOffset());
  });

  $(".back").click(function(event){
    socket.emit("fetch-boards");
  });
}

function BindPost(){
  $(".back").click(function(event){
    var boardId = $(this).attr("board-id");
    socket.emit("fetch-threads", boardId, new Date().getTimezoneOffset(), true);
  });
}
