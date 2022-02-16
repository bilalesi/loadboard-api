const cors = require("cors");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose")
const http = require("http")


const apiLoadboardController=require('./routes/loadboard')
//const userController=require('./controller/user')

const bodyParser = require("body-parser");

const app = express();
const server=http.createServer(app)
const io=require("socket.io")(server,{cors:{origin:"*"}})
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.set("socketio",io);

var db = mongoose.connect("mongodb+srv://loadboard-api:PZERz9cVltSplG5F@americanspecializedapid.nrkzp.mongodb.net/Integrations?retryWrites=true&w=majority",
    () => { console.log("connected") }, (e) => { console.log("failed to connect") });


//route based on path
app.use(express.static(path.join(__dirname,'public')));
app.use("/api/loadboard", apiLoadboardController);
app.use("/",apiLoadboardController);

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));
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
      </ul>
      <li>/activebidboardloads</li>
    </ul>
    <h3>Single Load:</h3>
    <ul>
      <li>/getLoad?oid=<span style="color:blue">integer</span></li>
      <li><span style="font-weight:bold;">OR</span></li>
      <li>/getLoad?_id=<span style="color:blue">integer</span></li>
    </ul>`)
});