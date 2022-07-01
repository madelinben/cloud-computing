//setup express
const express = require('express');
const app = express();
const port = 1000;

systemLeader = 0

//Get the hostname of the node
var os = require("os");
var myhostname = os.hostname();

const fs = require('fs');
nodesTxtFile = fs.readFileSync('nodes.txt');
nodes = JSON.parse(nodesTxtFile);

//setup zeromq
var zmq = require("zeromq"),
  sock = zmq.socket("pub");

//bind a publisher to port 3000 all IP addresses
sock.bindSync("tcp://" + nodes[myhostname].ip + ":3000");
console.log("ZeroMQ h Publisher bound to " + nodes[myhostname].ip + "port 3000");


//print the hostname
console.log(myhostname);

//route for get page /
app.get('/', (req, res) => {
 //Send the response to the browser
  res.send("<html> <body bgcolour=" + ((leader)? "#FF0000":"#00FF00") + "> Hello this is node " + myhostname + ((leader)? "I am the leader :-)":"I am not the leader :-(") + "</body></html>");
})

//bind node to the port
app.listen(port,  nodes[myhostname.ip] , () => {
  console.log(`Express listening at port ` + port);
})

var nodeID = Math.floor(Math.random() * (100 - 1 + 1) + 1);
toSend = {"hostname" : myhostname, "status": "alive","nodeID":nodeID} ;



//based on the interval publish a status message 
setInterval(function() {
  console.log("sending alive");
  sock.send(["status", JSON.stringify(toSend)]);
}, 500);


//check if leader
setInterval(function() {
  console.log(JSON.stringify(nodes));
  leader = 1;
  activeNodes = 0;
  Object.entries(nodes).forEach(([hostname,prop]) => {
    console.log("test" + JSON.stringify(hostname) + JSON.stringify(prop) )
    maxNodeID = nodeID;
    if(hostname != myhostname){
      if("nodeID" in prop){
        activeNodes++;
        if(prop.nodeID > nodeID)
        {
          leader = 0;
        }
      }
    }
    if((leader == 1) && (activeNodes == (nodes.length - 1)))
    {
      systemLeader = 1;
    }
  });
}, 2000);

//for each key value in nodes
Object.entries(nodes).forEach(([hostname,prop]) => {
  
    //print the hostname IP
    console.log("hostname = " + hostname + " ip = " + prop.ip);
//create a number of subscribers to connect to publishers
    var subsockets = [];
    if(myhostname != hostname ){
        tempsoc = zmq.socket("sub");
        tempsoc.connect("tcp://" + prop.ip + ":3000");
        tempsoc.subscribe("status");
        console.log("Subscriber connected to port 3000 of " + hostname);
        tempsoc.on("message", function(topic, message) {
          jsonMessage = JSON.parse(message.toString("utf-8"));
            console.log(
            "received a message from " + hostname + " related to:",
            topic.toString("utf-8"),
            "containing message:",
            jsonMessage.status + " with ID" + jsonMessage.nodeID
            );
            nodes[hostname].nodeID =  jsonMessage.nodeID;
        });
        //push this instance of a sub socket to the list.
        subsockets.push(tempsoc);
    }
});
