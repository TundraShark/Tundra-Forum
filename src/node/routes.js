var app    = require("../server.js").app;
var mysql  = require("mysql");
var fs     = require("fs");
var crypto = require("crypto");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "tundra_forum"
});

var algorithm = "aes-256-gcm";
var specialKey = "3zTvzr3p67VC61jmV54rIYu1545x4TlY";

function encrypt(text){
  console.log("User entered:", text);
  console.log("Special Key: ", specialKey);
  var trimmedKey = specialKey.substring(0, 32-text.length);;
  console.log("Trimmed Key: ", trimmedKey);
  var appendedKey = text+trimmedKey;
  console.log("Appended Key:", appendedKey);

  var iv = crypto.randomBytes(32);

  var cipher = crypto.createCipheriv(algorithm, appendedKey, iv)
  var encrypted = cipher.update(text, "utf-8", "base64")
  encrypted += cipher.final("base64");
  var tag = cipher.getAuthTag();
  return {
    content: encrypted,
    tag: tag,
    iv: iv.toString("base64")
  };
}

function decrypt(encrypted, pass, iv){
  console.log("User entered:", pass);
  console.log("Special Key: ", specialKey);
  var trimmedKey = specialKey.substring(0, 32-pass.length);;
  console.log("Trimmed Key: ", trimmedKey);
  var appendedKey = pass+trimmedKey;
  console.log("Appended Key:", appendedKey);

  var decipher = crypto.createDecipheriv(algorithm, appendedKey, iv)
  decipher.setAuthTag(encrypted.tag);
  var dec = decipher.update(encrypted.content, "base64", "utf-8")
  dec += decipher.final("utf-8");
  return dec;
}

app.post("/sign-up", function(req, res){
  var post  = req.body;
  var name  = post["name"];
  var pass  = post["pass"];
  var email = post["email"];
  var o;

  pass = encrypt(pass);
  var p_c = pass["content"];
  var p_t = pass["tag"];
  var iv  = pass["iv"];
  p_t = p_t.toString("base64");

  var sql  = "SELECT COUNT(*) AS count FROM users WHERE name=?";
  var args = [name];
  con.query(sql, args, function(err, rows){
    if(rows[0]["count"]){
      o = {"msg": `${name} That account already exists!`, "err": 1};
      res.json(o);
    }else{
      var newUser = {name: name, password_content: p_c, password_tag: p_t, password_iv: iv, email: email};
      con.query("INSERT INTO users SET ?", newUser, function(err, data){

      });
      o = {"msg": `Account created ${name}`, "err": 0};
      res.json(o);
    }
  });
});

app.post("/login", function(req, res){
  var post = req.body;
  var name = post["name"];
  var pass = post["pass"];

  var sql  = "SELECT COUNT(*) AS count, password_content, password_tag, password_iv FROM users WHERE ?";
  var args = [{name: name}];
  con.query(sql, args, function(err, rows){
    if(rows[0]["count"]){
      // Check if the password is correct
      var p_c = rows[0]["password_content"];
      var p_t = rows[0]["password_tag"];
      var iv = rows[0]["password_iv"];
      p_t = Buffer.from(p_t, "base64");
      iv  = Buffer.from(iv, "base64");
      var test_obj = {};
      test_obj["content"] = p_c;
      test_obj["tag"]     = p_t;

      var MAYBE = decrypt(test_obj, pass, iv);

      var token = crypto.randomBytes(48);
      token = token.toString("hex");

      var sql = "UPDATE users SET ? WHERE ?";
      var args = [
        {token: token},
        {name: name}
      ];

      con.query(sql, args, function(err, rows){
        var o = {"msg": token, "err": 0};
        res.json(o);
      });
    }else{
      var o = {"msg": `${name} does not exist!`, "err": 1};
      res.json(o);
    }
  });
});

app.post("/logout", function(req, res){
  var data = {"logout": true};
  res.json(data);
});

app.get("/", function(req, res){
  res.render("./index.ejs");
});

app.use(function(req, res){
  res.status(404);
  res.render("404.ejs");
});
