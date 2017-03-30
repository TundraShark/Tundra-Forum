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

// https://github.com/js-cookie/js-cookie
