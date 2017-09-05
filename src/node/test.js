var request = require("supertest");
var server  = require("../src/server");
var mysql   = require("mysql");
var io      = require("socket.io-client");
var assert  = require("chai").assert;
var fs      = require("fs");
var db      = require("../package.json").db;
var client;

var options = {
  transports: ["websocket"],
  forceNew: true,
  reconnection: false
};

var con = mysql.createConnection({
  host:     db["host"],
  user:     db["user"],
  password: db["password"],
  database: db["database"]
});

describe("Running all tests", function (){
  beforeEach(() => client = io.connect("http://localhost:9001/", options));
  afterEach(() => client.disconnect());

  var token1, token2;

  it("Truncating all tables", function(done){
    con.query("SET FOREIGN_KEY_CHECKS = 0", function(err, rows){
      con.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='tundra_forum'", function(err, rows){
        var lock = rows.length;
        for(var i = 0; i < rows.length; i++){
          var table = rows[i]["TABLE_NAME"];
          var sql = `TRUNCATE ${table}`;
          con.query(sql, function(err, rows){
            if(--lock == 0){
              con.query("SET FOREIGN_KEY_CHECKS = 1", function(err, rows){
                done();
              });
            }
          });
        }
      });
    });
  });

  it("Get index", function(done){
    request(server)
    .get("/")
    .expect(200, done);
  });

  it("Check 404", function(done){
    request(server)
    .get("/thispagedoesntexist")
    .expect(404, done);
  });

  it("Create account #1", function(done){
    request(server)
    .post("/sign-up")
    .send({name: "Alex", pass: "encryptThis!", email: "yolo@gmail.com"})
    .then(function(res){
      assert(res.body["err"] == 0);
      done();
    });
  });

  it("Create account #2", function(done){
    request(server)
    .post("/sign-up")
    .send({name: "Ben", pass: "justSomePassword", email: "swag@gmail.com"})
    .then(function(res){
      assert(res.body["err"] == 0);
      done();
    });
  });

  it("Create account that already exists", function(done){
    request(server)
    .post("/sign-up")
    .send({name: "Alex", pass: "somePassword", email: "teehee@yahoo.com"})
    .then(function(res){
      assert(res.body["err"] == 1);
      done();
    });
  });

  it("Login with an account that doesn't exist", function(done){
    request(server)
    .post("/login")
    .send({name: "Zed", pass: "Xyz"})
    .then(function(res){
      assert(res.body["err"] == 1);
      done();
    });
  });

  it("Attempt a login to an existing account with a bad password", function(done){
    request(server)
    .post("/login")
    .send({name: "Alex", pass: "incorrectPassword"})
    .then(function(res){
      assert(res.body["err"] == 1);
      done();
    });
  });

  it("Simulate login (get token for account #1)", function(done){
    request(server)
    .post("/login")
    .send({name: "Alex", pass: "encryptThis!"})
    .then(function(){
      con.query("SELECT token FROM users WHERE name='Alex'", function(err, rows){
        token1 = rows[0]["token"];
        assert(token1);
        done();
      });
    });
  });

  it("Simulate login (get token for account #2)", function(done){
    request(server)
    .post("/login")
    .send({name: "Ben", pass: "justSomePassword"})
    .then(function(){
      con.query("SELECT token FROM users WHERE name='Ben'", function(err, rows){
        token2 = rows[0]["token"];
        assert(token2);
        done();
      });
    });
  });

  it("Attempt to set a title for account #1 with a bad token", function(done){
    var obj = {};
    obj["userId"] = 1;
    obj["token"]  = "BAD_TOKEN";
    obj["title"]  = "Fizz Main";

    client.emit("set-title", obj);
    client.on("set-title", function(msg){
      assert(!msg);
      done();
    });
  });

  it("Set a title for account #1", function(done){
    var obj = {};
    obj["userId"] = 1;
    obj["token"]  = token1;
    obj["title"]  = "Fizz Main";

    client.emit("set-title", obj);
    client.on("set-title", function(msg){
      assert(msg);
      done();
    });
  });

  it("Try to create a board without permission", function(done){
    var obj = {};
    obj["userId"]    = 1;
    obj["token"]     = token1;
    obj["boardName"] = "Introductions";
    obj["boardDesc"] = "Introduce yourself here";

    client.emit("create-board", obj);
    client.on("create-board", function(msg){
      assert(msg == false);
      done();
    });
  });

  it("Give user #1 permission", function(done){
    con.query("UPDATE users SET permission=100 WHERE user_id=1", function(err, rows){
      assert(true);
      done();
    });
  });

  it("Create a board (Introductions)", function(done){
    var obj = {};
    obj["userId"]    = 1;
    obj["token"]     = token1;
    obj["boardName"] = "Introductions";
    obj["boardDesc"] = "Introduce yourself";

    client.emit("create-board", obj);
    client.on("create-board", function(msg){
      assert(msg);
      done();
    });
  });

  it("Create a board (General Discussion)", function(done){
    var obj = {};
    obj["userId"]    = 1;
    obj["token"]     = token1;
    obj["boardName"] = "General Discussion";
    obj["boardDesc"] = "Talk about anything";

    client.emit("create-board", obj);
    client.on("create-board", function(msg){
      assert(msg);
      done();
    });
  });

  it("Create thread #1 in Introductions", function(done){
    var obj = {};
    obj["userId"]      = 1;
    obj["token"]       = token1;
    obj["boardId"]     = 1;
    obj["threadTitle"] = "Hello everyone!";
    obj["post"]        = "I am new here, and this post is also the very first post for a test case.";

    client.emit("create-thread", obj);
    client.on("create-thread", function(msg){
      assert(msg);
      done();
    });
  });

  it("Create thread #2 in Introductions", function(done){
    var obj = {};
    obj["userId"]      = 2;
    obj["token"]       = token2;
    obj["boardId"]     = 1;
    obj["threadTitle"] = "Ben here";
    obj["post"]        = "This account's name is Ben";

    client.emit("create-thread", obj);
    client.on("create-thread", function(msg){
      assert(msg);
      done();
    });
  });

  it("Make a post Introductions thread #1", function(done){
    var obj = {};
    obj["userId"]   = 1;
    obj["token"]    = token1;
    obj["threadId"] = 1;
    obj["post"]     = "This is the second post in the first thread that was made";

    client.emit("create-post", obj);
    client.on("create-post", function(msg){
      assert(msg);
      done();
    });
  });

  it("Make a post Introductions thread #2", function(done){
    var obj = {};
    obj["userId"]   = 1;
    obj["token"]    = token1;
    obj["threadId"] = 2;
    obj["post"]     = "Hello there Ben, my name is Alex. Nice to meet you!";

    client.emit("create-post", obj);
    client.on("create-post", function(msg){
      assert(msg);
      done();
    });
  });

  it("Make a post Introductions thread #2", function(done){
    var obj = {};
    obj["userId"]   = 2;
    obj["token"]    = token2;
    obj["threadId"] = 2;
    obj["post"]     = "Hey thanks Alex.";

    client.emit("create-post", obj);
    client.on("create-post", function(msg){
      assert(msg);
      done();
    });
  });

  it("With an invalid login, try to create a board", function(done){
    con.query("SELECT token FROM users WHERE user_id=1", function(err, rows){
      var obj = {};
      obj["userId"]    = 1;
      obj["token"]     = "BAD_TOKEN";
      obj["boardName"] = "Introductions";
      obj["boardDesc"] = "Introduce yourself here";

      client.emit("create-board", obj);
      client.on("create-board", function(msg){
        assert(msg == false);
        done();
      });
    });
  });

  it("With an invalid login, try to create a thread", function(done){
    con.query("SELECT token FROM users WHERE user_id=1", function(err, rows){
      var obj = {};
      obj["userId"]      = 1;
      obj["token"]       = "BAD_TOKEN";
      obj["boardId"]     = 1;
      obj["threadTitle"] = "Hello everyone!";
      obj["post"]        = "I am new here, and this post is also the very first post for a test case.";

      client.emit("create-thread", obj);
      client.on("create-thread", function(msg){
        assert(msg == false);
        done();
      });
    });
  });

  it("With an invalid login, try to make a post", function(done){
    con.query("SELECT token FROM users WHERE user_id=1", function(err, rows){
      var obj = {};
      obj["userId"]   = 1;
      obj["token"]    = "BAD_TOKEN";
      obj["threadId"] = 1;
      obj["post"]     = "This is the second post in the first thread that was made";

      client.emit("create-post", obj);
      client.on("create-post", function(msg){
        assert(msg == false);
        done();
      });
    });
  });

  it("Fetch boards", function(done){
    client.emit("fetch-boards", 1, 0);
    client.on("fetch-boards", function(msg){
      assert(msg);
      done();
    });
  });

  it("Fetch threads", function(done){
    client.emit("fetch-threads", 1, 0);
    client.on("fetch-threads", function(msg){
      assert(msg);
      done();
    });
  });

  it("Fetch posts", function(done){
    client.emit("fetch-posts", 1, 0);
    client.on("fetch-posts", function(msg){
      assert(msg);
      done();
    });
  });

  it("Logout", function(done){
    var data = {"abc": "def"};
    request(server)
      .post("/logout")
      .send(data)
      .expect({"logout": true}, done);
  });
});
