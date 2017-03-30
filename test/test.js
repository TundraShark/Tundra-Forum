var request = require("supertest");
var server  = require("../src/server");
var mysql   = require("mysql");
var io      = require("socket.io-client");
var assert  = require("chai").assert;
var fs      = require("fs");
var client;

var options = {
  transports: ["websocket"],
  forceNew: true,
  reconnection: false
};

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "tundra_forum"
});

describe("Running all tests", function (){
  beforeEach(() => client = io.connect("http://localhost:9001/", options));
  afterEach(() => client.disconnect());

  var token;

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

  it("Create account", function(done){
    request(server)
    .post("/sign-up")
    .send({name: "Alex", pass: "encryptThis!", email: "yolo@gmail.com"})
    .then(function(res){
      assert(res.body["err"] == 0);
      done();
    });
  });

  it("Create account that already exists", function(done){
    request(server)
    .post("/sign-up")
    .send({name: "Alex", pass: "somePassword", email: "swag@yahoo.com"})
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

  it("Login with a valid account", function(done){
    request(server)
    .post("/login")
    .send({name: "Alex", pass: "encryptThis!"})
    .then(function(){
      con.query("SELECT token FROM users WHERE name='Alex'", function(err, rows){
        token = rows[0]["token"];
        assert(token);
        done();
      });
    });
  });

  it("Try to create a board without permission", function(done){
    con.query("SELECT token FROM users WHERE user_id=1", function(err, rows){
      var obj = {};
      obj["userId"]    = 1;
      obj["token"]     = token;
      obj["boardName"] = "Introductions";
      obj["boardDesc"] = "Introduce yourself here";

      client.emit("create-board", obj);
      client.on("create-board", function(msg){
        assert(msg == false);
        done();
      });
    });
  });

  it("Give user permission", function(done){
    con.query("UPDATE users SET permission=100 WHERE user_id=1", function(err, rows){
      assert(true);
      done();
    });
  });

  it("Create a board with permission", function(done){
    con.query("SELECT token FROM users WHERE user_id=1", function(err, rows){
      var obj = {};
      obj["userId"]    = 1;
      obj["token"]     = token;
      obj["boardName"] = "Introductions";
      obj["boardDesc"] = "Introduce yourself here";

      client.emit("create-board", obj);
      client.on("create-board", function(msg){
        assert(msg);
        done();
      });
    });
  });

  it("Create a thread in that board", function(done){
    con.query("SELECT token FROM users WHERE user_id=1", function(err, rows){
      var obj = {};
      obj["userId"]      = 1;
      obj["token"]       = token;
      obj["boardId"]     = 1;
      obj["threadTitle"] = "Hello everyone!";
      obj["post"]        = "I am new here, and this post is also the very first post for a test case.";

      client.emit("create-thread", obj);
      client.on("create-thread", function(msg){
        assert(msg);
        done();
      });
    });
  });

  it("Make a post in that thread", function(done){
    con.query("SELECT token FROM users WHERE user_id=1", function(err, rows){
      var obj = {};
      obj["userId"]   = 1;
      obj["token"]    = token;
      obj["threadId"] = 1;
      obj["post"]     = "This is the second post in the first thread that was made";

      client.emit("create-post", obj);
      client.on("create-post", function(msg){
        assert(msg);
        done();
      });
    });
  });

  it("With an invalid login, try to create a board", function(done){
    con.query("SELECT token FROM users WHERE user_id=1", function(err, rows){
      var obj = {};
      obj["userId"]    = 2;
      obj["token"]     = token;
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
      obj["userId"]      = 2;
      obj["token"]       = token;
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
      obj["userId"]   = 2;
      obj["token"]    = token;
      obj["threadId"] = 1;
      obj["post"]     = "This is the second post in the first thread that was made";

      client.emit("create-post", obj);
      client.on("create-post", function(msg){
        assert(msg == false);
        done();
      });
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
