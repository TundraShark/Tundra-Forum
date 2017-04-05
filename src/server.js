// process.chdir("./src");                           // Sets working directory to the code's source directory
var express    = require("express");              // Express
var bodyParser = require("body-parser");          // Allows you to read POST data
var sass       = require("node-sass-middleware"); // SASS
var app        = exports.app = express();         // Define the application
app.set("views", "./views");                      // Define the views directory
app.use(express.static("./static"));              // Define the static directory
app.use(bodyParser.json());                       // Support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // Support URL-encoded bodies
app.use(sass({src:   __dirname + "/static/css/sass",
              dest:  __dirname + "/static/css",
              prefix: "/css",
              outputStyle: "compressed"}));

// All options are set. I must now require the routes, start the server,
// create the websockets, and then require the file that has my websocket code
require("./node/routes.js");
var server = app.listen(9001);
var io     = exports.io = require("socket.io")(server, {"pingInterval": 5000, "pingTimeout": 12000});
require("./node/io.js");

module.exports = server // Export
