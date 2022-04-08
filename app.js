require('dotenv').config();
require("./service/passport-setup");
const cors = require("cors");
const path = require("path");
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const passport = require('passport');
const nconf = require('nconf');
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser"); // parse cookie header

nconf.env().argv();

const apiLoadboardController= require('./routes/loadboard');
const authRouter = require('./routes/auth');
//const userController=require('./controller/user')

const bodyParser = require("body-parser");

const app = express();
const server=http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const monitorStream = require('./service/monitor');

//const io = new Server(server, { cors: { origin: "http://localhost:3000" } });
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));
var creds = { username: nconf.get('MONGO_USERNAME'), password: nconf.get('MONGO_PASSWORD') }
var db = mongoose.connect("mongodb+srv://" + creds.username + ":" + creds.password + "@americanspecializedapid.nrkzp.mongodb.net/Integrations?retryWrites=true&w=majority")
.then(
  ()=> {
    console.log("connected");
    monitorStream.monitor(io);
  }
);

//route based on path
app.use(express.static(path.join(__dirname,'public')));
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.COOKIE_KEY],
    maxAge: 24 * 60 * 60 * 100
  })
);

// parse cookies
app.use(cookieParser());// initalize passport
app.use(passport.initialize());
// deserialize cookie from the browser
app.use(passport.session());
app.use(
  cors({
    origin: process.env.FRONTEND_DEV_URL, // allow to server to accept request from different origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true // allow session cookie from browser to pass through
  })
);

app.use("/", apiLoadboardController);
app.use("/api/loadboard", apiLoadboardController);
app.use('/auth', authRouter);

const port = parseInt(process.env.PORT) || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));

const reportData = require('./service/report');


io.on("connection", (socket) => {
  console.log('--New client connected--');

  const tableupdateFunc = (data) => {
    //console.log('data',data);
    //debugger;
    reportData.update({parameters:data,socket:socket,io:io}).then( (result) => {
      socket.emit("table-update", result);
      console.log('updated table data',result);
    });
  };

  const subFeedFunc = (data) => {
    console.log('-user subscribed to table: ' + data.report + '-');
    socket.join(data.report);
    console.log(data);

    socket.on('table-update',tableupdateFunc);

    return reportData.init({parameters:data,socket:socket,io:io}).then( (result) => {
      socket.emit("initialize", result);
      console.log('sent table data', result);
    });
    
  };

  socket.on('subscribeFeed',subFeedFunc);
  socket.on('unsubscribeFeed',(data)=>{
    console.log('user unsubscribed to table: ' + data.report);
  });
  
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

//display response based on path
app.get('/', (req, res) => {
  res.send(`<h1>API Endpoints Explained</h1>
    <h3>Multiple Loads:</h3>
    <ul>
      <li>/getloads?stops=<span style="color:green">Operand</span> <span style="color:blue">integer</span></li>
      <ul>
        <li><span style="color:green;font-weight:bold;">Operand Greater than (>)</span> or <span style="color:green;font-weight:bold;">Less than (<)</span> is available as the first character for filtering this content.</li>
        <li><span style="font-style:italic;">If no operand is used it does an equals search.</span></li>
        <li><h4>Sorting</h4></li>
        <ul>  
          <li><span style="">&sort=id,asc;bidboard,desc;created,desc</span></li>
        </ul>
      </ul>
    </ul>
    <h3>Single Load:</h3>
    <ul>
      <li>/getLoad?oid=<span style="color:blue">integer</span></li>
      <li><span style="font-weight:bold;">OR</span></li>
      <li>/getLoad?_id=<span style="color:blue">integer</span></li>
    </ul>`)
});

module.exports  = {
  io: io,
  app: app
};