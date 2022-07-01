const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const os = require('os');
const axios = require('axios');
var amqp = require('amqplib/callback_api');



//instance of express and port to use for inbound connections.
const app = express();
const port = 3000;

//tell express to use the body parser. Note - This function was built into express but then moved to a seperate package.
app.use(bodyParser.json());


//queueStarted
var rabbitMQStarted = false; // Allows list nodeList to populate otherwise every node spits out its leader.

var nodeHostName = os.hostname();
var nodeID = Math.floor(Math.random() * (100 - 1 + 1) + 1);
// isAlive
var alive = true; // Node Alive or Not
// isLeader
var nodeIsLeader = false; // Used to Set Single Node as Leader

var seconds = new Date().getTime() / 1000; // Used to establish last time node broadcasted a message.
var hasScaledUp = false; // Are we within NotFLIX Peak hours?

// Create list of nodes and message to be sent during timed interval.
var nodeMessage = { nodeID: nodeID, hostname: nodeHostName, lastMessage: seconds, alive: alive };
var nodeList = [];
nodeList.push(nodeMessage);



// Connection String Listening to Mongo Servers
//connection string listing the mongo servers. This is an alternative to using a load balancer. THIS SHOULD BE DISCUSSED IN YOUR ASSIGNMENT.
const connectionString = 'mongodb://localmongo1:27017,localmongo2:27017,localmongo3:27017/NotFlixDB?replicaSet=rs0';

//connect to the cluster
mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB Error:'));

var Schema = mongoose.Schema;

var NotFlixSchema = new Schema({
  // _id: Number,
  accountID: Number,
  userName: String,
  titleID: Number,
  userAction: String,
  dateTime: String,
  pointOfInteraction: String,
  typeOfInteraction: String
});

var NotFlixModel = mongoose.model('Data', NotFlixSchema, 'data');

app.get('/', (req, res) => {
  interactionModel.find({}, 'accountID userName titleID userAction dateTime pointOfInteraction typeOfInteraction', (err, data) => {
    if (err) return handleError(err);
    res.send(JSON.stringify(data));
  });
});

app.post('/', (req, res) => {
  var instance = new NotFlixModel(req.body);
  instance.save(function (err) {
    if (err) res.send('Error');
    res.send(JSON.stringify(req.body));
  });
});

app.put('/', (req, res) => {
  res.send('PUT request at /');
});

app.delete('/', (req, res) => {
  res.send('DELETE request at /');
});

//bind the express web service to the port specified
app.listen(port, () => {
  console.log(`Express Application listening at port ` + port);
});



// Node Broadcasts it is alive every five seconds.
setInterval(function () {
  amqp.connect('amqp://user:bitnami@6130CompAssignment_haproxy_1', function (error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }
      var exchange = "node alive";
      seconds = new Date().getTime() / 1000;
      // Message object which is broadcast to the listener.
      var msg = `{"nodeID": ${nodeID}, "hostname": "${nodeHostName}", "alive":"${alive}"}`
      var jsonMsg = JSON.stringify(JSON.parse(msg));
      channel.assertExchange(exchange, 'fanout', {
        durable: false
      });
      channel.publish(exchange, '', Buffer.from(jsonMsg));
      console.log('Sent publish message: %s', msg);
    });
    setTimeout(function () {
      connection.close();
    }, 500);
  });
}, 5000);

// Nodes Subscribe to Message
amqp.connect('amqp://user:bitnami@6130CompAssignment_haproxy_1', function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    var exchange = 'node alive';
    channel.assertExchange(exchange, 'fanout', {
      durable: false
    });
    channel.assertQueue('', {
      exclusive: true
    }, function (error2, q) {
      if (error2) {
        throw error2;
      }
      console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
      channel.bindQueue(q.queue, exchange, '');
      channel.consume(q.queue, function (msg) {
        if (msg.content) {
          rabbitMQStarted = true;
          var incomingNode = JSON.parse(msg.content.toString());
          seconds = new Date().getTime() / 1000;
          /*Check if node is in list by its hostname, if not update the list, 
          else amend node with current seconds value and any new ID that a restarted node may have acquired.
          */
          if (nodeList.some(nodes => nodes.hostname === incomingNode.hostname)) {
            var matchedNode = nodeList.find(e => e.hostname === incomingNode.hostname);
            matchedNode.lastMessage = seconds;
            if (matchedNode.nodeID !== incomingNode.nodeID) {
              matchedNode.nodeID = incomingNode.nodeID;
            }
          } else {
            nodeList.push(incomingNode);
          }
          console.log("List of Alive Nodes");
          console.log(nodeList);
        }
      }, {
        noAck: true
      });
    });
  });
});

// Find leader based on ID and broadcast it every two seconds.
setInterval(function () {
  if (rabbitMQStarted) {
    var maxNodeID = 0; // To store current highest nodeID during the iteration.
    Object.entries(nodeList).forEach(([index, node]) => {
      if (node.hostname != nodeHostName) {
        if (node.nodeID > maxNodeID) {
          maxNodeID = node.nodeID;
        }
      }
    });
    if (nodeID >= maxNodeID) {
      console.log("The leader is: " + nodeHostName);
      nodeIsLeader = true;
    }
  }
}, 2000);

// Node hasn't sent message in ten seconds create a new instance of App.js
setInterval(function () {
  var deadNodes = []; // Temporary list storing dead nodes.
  Object.entries(nodeList).forEach(([index, node]) => {
    var timeBetweenMessage = Math.round(seconds - node.lastMessage);
    if (timeBetweenMessage > 10) {
      node.alive = false;
      deadNodes.push(node)
      nodeList.splice(index, 1); // Remove node from list of alive nodes as it is no longer needed.
      console.log("Node no longer alive: " + node.hostname);
    }
    else {
      node.alive = true;
      console.log("I am alive: " + node.hostname);
    }
  });
  if (nodeIsLeader) {
    // Create new container for every dead node that has occured.
    var randomAppNode = Math.floor(Math.random() * (999 - 100 + 1) + 100); // Give new node random 3 digit name for its hostname
    deadNodes.forEach(function (node, index) {
      var hostname = "AppNode" + (randomAppNode);
      var containerDetails = {
        Image: "6130compassignment_node1",
        Hostname: hostname,
        NetworkingConfig: {
          EndpointsConfig: {
            "6130compassignment_nodejs": {},
          },
        }
      };
      createContainer(hostname, containerDetails);
    });
  }
}, 20000);



async function createContainer(containerName, containerDetails) {
  try {
    console.log(`Attempting to start container: ${containerName}`);
    await axios.post(`http://host.docker.internal:2375/containers/create?name=${containerName}`, containerDetails).then(function (response) { console.log(response) });
    await axios.post(`http://host.docker.internal:2375/containers/${containerName}/start`);
  } catch (error) {
    console.log(error);
  }
}

async function removeContainer(containerName) {
  try {
    console.log(`Attempting to kill container: ${containerName}`);
    await axios.post(`http://host.docker.internal:2375/containers/${containerName}/kill`);
    await axios.delete(`http://host.docker.internal:2375/containers/${containerName}`);
  } catch (error) {
    console.log(error);
  }
}

// If node within NotFLIX peak hours, spin up new two new instances to acommodate.
setInterval(function () {
  if (nodeIsLeader) {
    var nowHour = new Date().getHours();
    var randomAppNode1 = Math.floor(Math.random() * (999 - 100 + 1) + 100); // Give new node random 3 digit name for its hostname
    var randomAppNode2 = Math.floor(Math.random() * (999 - 100 + 1) + 100);
    if (nowHour >= 15 && nowHour < 17 && !hasScaledUp) { // Hours are 1 behind due to Daylight Saving Time
      console.log("NotFLIX peak hours reached, spinning up two new containers");
      var containerDetails = [{
        Image: "6130compassignment_node1",
        Hostname: "app" + randomAppNode1,
        NetworkingConfig: {
          EndpointsConfig: {
            "6130compassignment_nodejs": {},
          },
        },

      }, {
        Image: "6130compassignment_node1",
        Hostname: "app" + randomAppNode2,
        NetworkingConfig: {
          EndpointsConfig: {
            "6130compassignment_nodejs": {},
          },
        },
      }];
      console.log("Node has died, starting new node");
      containerDetails.forEach(function (node, index) {
        var nodeName = "AppNode" + node.Hostname.substring(3);
        createContainer(nodeName, node);
      });
      hasScaledUp = true; // Stops this from running multiple times.
    }
    if (nowHour < 15 && nowHour >= 17 && hasScaledUp) { // Gets last two nodes from list, kills and removes them stopping from being brought back up.
      const nodeToDelete1 = "AppNode" + nodeList.slice(-1)[0].hostname.substring(3);
      const nodeToDelete2 = "AppNode" + nodeList.slice(-2)[0].hostname.substring(3);
      removeContainer(nodeToDelete1);
      removeContainer(nodeToDelete2);
      hasScaledUp = false;
    }
  }
}, 5000);
