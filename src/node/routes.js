var app     = require("../server.js").app;
var mysql   = require("mysql");
var fs      = require("fs");
var crypto  = require("crypto");
var version = require("../../package.json").version;

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Fizz",
  database: "tundra_forum"
});

// fs.readFile("../config.json", "utf-8", (error, data) => {
//   if(error){
//     console.log(error);
//     return;
//   }

//   data = JSON.parse(data);
//   console.log(data);

//   con = mysql.createConnection({
//     host    : data["host"],
//     user    : data["user"],
//     password: data["password"],
//     database: data["database"]
//   });
// });

function Encrypt(password){
  var algorithm = "aes-256-gcm";
  var specialKey = "3zTvzr3p67VC61jmV54rIYu1545x4TlY";
  var trimmedKey = specialKey.substring(0, 32-password.length);
  var appendedKey = password+trimmedKey;

  var iv = crypto.randomBytes(32);

  var cipher = crypto.createCipheriv(algorithm, appendedKey, iv);
  var encrypted = cipher.update(password, "utf-8", "base64");
  encrypted += cipher.final("base64");
  var tag = cipher.getAuthTag();

  // The tag and IV are both byte arrays, so they need to be
  // converted into base64 so that the database can store them
  return {
    content: encrypted,
    tag: tag.toString("base64"),
    iv: iv.toString("base64")
  };
}

function Decrypt(encryptedData, password, passwordIv){
  var algorithm = "aes-256-gcm";
  var specialKey = "3zTvzr3p67VC61jmV54rIYu1545x4TlY";
  var trimmedKey = specialKey.substring(0, 32-password.length);
  var appendedKey = password+trimmedKey;
  var decipher = crypto.createDecipheriv(algorithm, appendedKey, passwordIv);
  decipher.setAuthTag(encryptedData.tag);
  var dec = decipher.update(encryptedData.content, "base64", "utf-8");

  try{
    dec += decipher.final("utf-8");
  }catch(e){
    return false;
  }

  return dec;
}

app.post("/sign-up", function(req, res){
  var post  = req.body;
  var name  = post["name"];
  var email = post["email"];

  // Create an encrypted object from the password that the user gave
  var password        = Encrypt(post["pass"]);
  var passwordContent = password["content"];
  var passwordTag     = password["tag"];
  var passwordIv      = password["iv"];

  var sql  = "SELECT COUNT(*) AS count FROM users WHERE name=?";
  var args = [name];
  con.query(sql, args, function(err, rows){
    if(rows[0]["count"]){
      res.json({"msg": `${name} That account already exists!`, "err": 1});
    }else{
      var newUser = {name: name, password_content: passwordContent, password_tag: passwordTag, password_iv: passwordIv, email: email};
      con.query("INSERT INTO users SET ?", newUser, function(err){
        res.json({"msg": `Account created ${name}`, "err": 0});
      });
    }
  });
});

app.post("/login", function(req, res){
  var post     = req.body;
  var name     = post["name"];
  var password = post["pass"];

  var sql  = "SELECT COUNT(*) AS count, password_content, password_tag, password_iv FROM users WHERE ?";
  var args = [{name: name}];
  con.query(sql, args, function(err, rows){
    if(rows[0]["count"]){
      var passwordContent = rows[0]["password_content"];
      var passwordTag     = rows[0]["password_tag"];
      var passwordIv      = rows[0]["password_iv"];

      // The password tag and IV were stored as base64,
      // so they need to be converted into a byte buffer
      passwordTag = Buffer.from(passwordTag, "base64");
      passwordIv  = Buffer.from(passwordIv,  "base64");

      // Create an encrypted data object which will then be decrypted
      var encryptedData = {};
      encryptedData["content"] = passwordContent;
      encryptedData["tag"]     = passwordTag;

      // Check if the password was invalid
      if(Decrypt(encryptedData, password, passwordIv) === false){
        res.json({"msg": "Invalid username or password", "err": 1});
        return;
      }

      // Create a token for the now logged-in user and
      // store it in the database and give it to them
      var token = crypto.randomBytes(48).toString("hex");
      var sql   = "UPDATE users SET ? WHERE ?";
      var args  = [
        {token: token},
        {name: name}
      ];

      con.query(sql, args, function(err, rows){
        res.json({"msg": token, "err": 0});
      });
    }else{
      res.json({"msg": `Invalid username or password`, "err": 1});
    }
  });
});

app.post("/logout", function(req, res){
  var data = {"logout": true};
  res.json(data);
});

app.get("/", function(req, res){
  res.render("index.ejs", {version: version});
});

app.use(function(req, res){
  res.status(404);
  res.render("404.ejs");
});
