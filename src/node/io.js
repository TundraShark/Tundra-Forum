var io     = require("../server.js").io;
var mysql  = require("mysql");
var ejs    = require("ejs");
var moment = require("moment");
var fs     = require("fs");
var db     = require("../../package.json").db;

// TODO!
// Google the function of ejs.renderFile()
// and check what things the option parameter can do!

var players = {};
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

var con = mysql.createConnection({
  host:     db["host"],
  user:     db["user"],
  password: db["password"],
  database: db["database"]
});

function Authenticate(msg, perm = 0){return new Promise((done) => {
  var userId = msg["userId"];
  var token  = msg["token"];
  var sql    = "SELECT permission FROM users WHERE ? AND ?";
  var args   = [{user_id: userId}, {token: token}];
  con.query(sql, args, function(err, rows){
    if(rows.length){
      if(rows[0]["permission"] >= perm){
        done(true); // User has permission
      }else{
        done(false); // User doesn't have permission
      }
    }else{
      done(false); // User doesn't exist
    }
  });
});}

io.on("connection", function(socket){
  // Getting the IP address is currently broken on Socket.IO version 2.0.3
  // I need to wait for a patch in order to properly get the IP address
  // var ip = socket.request.connection._peername.address;
  // Until then, just set the IP address to 127.0.0.1
  var ip = "127.0.0.1";
  var player = {}
  player.num = 1;
  player.id  = 1;
  players[socket.id] = player;
  // console.log("New connection:");console.log(ip);

  function CreateBoard(msg, res){return new Promise((done) => {
    if(res){
      var boardName = msg["boardName"];
      var boardDesc = msg["boardDesc"];
      var newBoard = {name: boardName, description: boardDesc};
      con.query("INSERT INTO boards SET ?", newBoard, function(err){
        socket.emit("create-board", true);
        done();
      });
    }else{
      socket.emit("create-board", false);
      done();
    }
  });}

  function CreateThread(msg, res){return new Promise((done) => {
    if(res){
      var userId      = msg["userId"];
      var boardId     = msg["boardId"];
      var threadTitle = msg["threadTitle"];
      var post        = msg["post"];
      var time        = moment.utc().format("YYYY-MM-DD HH:mm:ss");
      var newThread   = {board_id: boardId, author: userId, last_poster_id: userId, last_poster_date: time, post_date: time, title: threadTitle};
      con.query("INSERT INTO threads SET ?", newThread, function(err, res){
        var newPost = {thread_id: res.insertId, author: userId, post: post, first_post: 1, ip_address: ip, post_date: time};
        con.query("INSERT INTO posts SET ?", newPost, function(err){
          con.query("UPDATE boards SET thread_count = thread_count + 1, post_count = post_count + 1 WHERE board_id = ?", boardId, function(err){
            socket.emit("create-thread", true);
            done();
          });
        });
      });
    }else{
      socket.emit("create-thread", false);
      done();
    }
  });}

  function CreatePost(msg, res){return new Promise((done) => {
    if(res){
      var userId   = msg["userId"];
      var threadId = msg["threadId"];
      var post     = msg["post"];
      var time     = moment.utc().format("YYYY-MM-DD HH:mm:ss");
      var newPost  = {thread_id: threadId, author: userId, post: post, ip_address: ip, post_date: time};
      con.query("INSERT INTO posts SET ?", newPost, function(err){
        con.query("UPDATE threads SET post_count = post_count + 1 WHERE thread_id = ?", threadId, function(err){
          con.query("UPDATE boards SET post_count = post_count + 1 WHERE board_id = (SELECT board_id FROM threads WHERE thread_id = ?)", threadId, function(err){
            socket.emit("create-post", true);
            done();
          });
        });
      });
    }else{
      socket.emit("create-post", false);
      done();
    }
  });}

  function SetTitle(msg, res){return new Promise((done) => {
    if(res){
      var userId = msg["userId"];
      var title  = msg["title"];
      var args   = [{title: title}, {user_id: userId}];
      con.query("UPDATE users SET ? WHERE ?", args, function(err){
        socket.emit("set-title", true);
        done();
      });
    }else{
      socket.emit("set-title", false);
      done();
    }
  });}

  function FormatDateShort(date, tz){
    // Convert the dates into the user's local time
    date.setTime(date.getTime() + (-tz * 60 * 1000));
    return date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear();
  }

  function FormatDateLong(date, tz){
    // Convert the dates into the user's local time
    date.setTime(date.getTime() + (-tz * 60 * 1000));
    var hours = date.getHours();
    var ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12; // Set hours to 0 (if 0-11) or 1 (if 12-23)
    hours = hours ? hours : 12; // Set hours to 12 if it's 0
    return date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear() + " - " + hours + ":" + date.getMinutes() + " " + ampm;
  }

  socket.on("set-title", function(msg){
    Authenticate(msg)
    .then((res) => SetTitle(msg, res));
  });

  socket.on("create-board", function(msg){
    Authenticate(msg, 100)
    .then((res) => CreateBoard(msg, res));
  });

  socket.on("create-thread", function(msg){
    Authenticate(msg)
    .then((res) => CreateThread(msg, res));
  });

  socket.on("create-post", function(msg){
    Authenticate(msg)
    .then((res) => CreatePost(msg, res));
  });

  socket.on("disconnect", function(){
    delete players[socket.id];
  });

  socket.on("fetch-boards", function(){
    var sql = "SELECT * FROM boards";
    con.query(sql, function(err, rows){
      ejs.renderFile("./views/test.ejs", {rows: rows}, function(err, html){
        socket.emit("fetch-boards", html);
      });
    });
  });

  socket.on("fetch-threads", function(msg, tz){
    var sql = "SELECT * FROM threads WHERE board_id = ?";
    var args = [msg];
    con.query(sql, args, function(err, rows){
      for(var i = 0; i < rows.length; i++){
        rows[i]["last_poster_date"] = FormatDateShort(rows[i]["last_poster_date"], tz);
        rows[i]["post_date"]        = FormatDateShort(rows[i]["post_date"], tz);
      }

      ejs.renderFile("./views/test2.ejs", {rows: rows}, function(err, html){
        socket.emit("fetch-threads", html);
      });
    });
  });

  socket.on("fetch-posts", function(msg, tz){
    var sql = "SELECT t.board_id, p.*, u.user_id, u.name, u.title FROM posts p JOIN users u ON author = user_id JOIN threads t ON p.thread_id = t.thread_id WHERE p.thread_id = ?";
    var args = [msg];
    con.query(sql, args, function(err, rows){
      for(var i = 0; i < rows.length; i++){
        rows[i]["post_date"] = FormatDateLong(rows[i]["post_date"], tz);
      }

      ejs.renderFile("./views/test3.ejs", {rows: rows}, function(err, html){
        socket.emit("fetch-posts", html);
      });
    });
  });

  // Get the boards listing for the user
  // NOTE: This depends on what the URL is because I want people
  //       to be able to go to a specific board or thread

  var sql = "SELECT * FROM boards";
  con.query(sql, function(err, rows){
    ejs.renderFile("./views/test.ejs", {rows: rows}, function(err, html){
      socket.emit("fetch-boards-old", html);
    });
  });
});

/*
  io.emit("post", post);           // Send to everybody
  io.to(socket.id).emit("hi", ""); // Send to a specific user
  socket.broadcast.emit("hi", ""); // Send to everyone but the user
  socket.emit("bad-auth", "BAD");  // Only send to the user

  ===== NOTE =====
  These two do the same things
  -> io.to(socket.id).emit
  -> socket.emit

  io.to(socket.id).emit("custom", "Too many people!"); // Send to a specific person
  socket.disconnect(socket.id);                                                     */
