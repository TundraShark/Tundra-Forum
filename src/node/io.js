var io    = require("../server.js").io;
var mysql = require("mysql");
var fs    = require("fs");

var players = {};

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "tundra_forum"
});

function Authenticate(msg, perm = 0){return new Promise((done) => {
  var userId = msg["userId"];
  var token  = msg["token"];
  var sql    = "SELECT permission FROM users WHERE ? AND ?;";
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
  var ip = socket.conn.remoteAddress;

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
      var newThread   = {board_id: boardId, author: userId, title: threadTitle, last_poster_id: userId};
      con.query("INSERT INTO threads SET ?", newThread, function(err, res){
        var newPost = {thread_id: res.insertId, author: userId, post: post, first_post: 1, ip_address: ip};
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
  })};

  function CreatePost(msg, res){return new Promise((done) => {
    if(res){
      var userId   = msg["userId"];
      var threadId = msg["threadId"];
      var post     = msg["post"];
      var newPost  = {thread_id: threadId, author: userId, post: post, ip_address: ip};
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
  })};

  var player = {};
  player.num = 1;
  player.id  = 1;
  players[socket.id] = player;

  // io.to(socket.id).emit("custom", "Your ID is: " + idCounter);

  socket.on("disconnect", function(){
    delete players[socket.id];
  });

  // Send to everyone but the user that just made the connection
  socket.broadcast.emit("hi", "someone else joined");

  // Do this when the server receives a message titled, "message_c2s"
  // socket.on("message_c2s", function(msg){
  //   io.emit("message_s2c", msg);

  //   if(msg == "stop") stopServer = true;
  // });

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
