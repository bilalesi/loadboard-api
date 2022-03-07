const cors = require("cors");
const path = require("path");
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const apiLoadboardController=require('./routes/loadboard')
//const userController=require('./controller/user')

const bodyParser = require("body-parser");

const app = express();
const server=http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
//const io = new Server(server, { cors: { origin: "http://localhost:3000" } });
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));

var db = mongoose.connect("mongodb+srv://loadboard-api:ol3nU0xJrdC7t7Jx@americanspecializedapid.nrkzp.mongodb.net/Integrations?retryWrites=true&w=majority",
  () => { console.log("connected") }, (e) => { console.log("failed to connect") });


//route based on path
app.use(express.static(path.join(__dirname,'public')));
app.use("/api/loadboard", apiLoadboardController);
app.use("/",apiLoadboardController);

const port = parseInt(process.env.PORT) || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));

const reportData = require('./service/report');

io.on("connection", (socket) => {
  console.log('New client connected');

  socket.on('subscribeFeed',(data)=>{
    console.log('user subscribed to table: ' + data.report);
    socket.join(data.report);
    console.log(data);

    reportData.init(data,socket,io).then( (result) => {
      socket.emit("initialize", result);
      console.log('sent table data');
    } );
    
  });
  socket.on('unsubscribeFeed',(data)=>{
    console.log('user unsubscribed to table: ' + data.report);
  });
  
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

//module.exports = server;

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