const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const os = require('os');
const axios = require('axios');
var amqp = require('amqplib/callback_api');

const port = 3000;
const app = express();
app.use(bodyParser.json());

var rabbitMQStarted = false;
var nodeHostName = os.hostname();
var nodeID = Math.floor(Math.random() * (100 - 1 + 1) + 1);
var alive = true;
var nodeIsLeader = false;
var seconds = new Date().getTime() / 1000;
var hasScaledUp = false;

var nodeMessage = { nodeID: nodeID, hostname: nodeHostName, lastMessage: seconds, alive: alive };
var nodeList = [];
nodeList.push(nodeMessage);

const connectionString = 'mongodb://localmongo1:27017,localmongo2:27017,localmongo3:27017/NotFlixDB?replicaSet=rs0';
mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB Error:'));

var Schema = mongoose.Schema;
var BigOilSchema = new Schema({
  // _id: Number,
  rigID: Number,
  deviceID: Number,
  sensorData: String,
  timeStamp: String
});

var BigOilModel = mongoose.model('Data', BigOilSchema, 'data');

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

app.listen(port, () => {
  console.log(`Express Application listening at port ` + port);
});

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

setInterval(function () {
  if (rabbitMQStarted) {
    var maxNodeID = 0;
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

setInterval(function () {
  var deadNodes = [];
  Object.entries(nodeList).forEach(([index, node]) => {
    var timeBetweenMessage = Math.round(seconds - node.lastMessage);
    if (timeBetweenMessage > 10) {
      node.alive = false;
      deadNodes.push(node)
      nodeList.splice(index, 1);
      console.log("Node no longer alive: " + node.hostname);
    }
    else {
      node.alive = true;
      console.log("I am alive: " + node.hostname);
    }
  });
  if (nodeIsLeader) {
    var randomAppNode = Math.floor(Math.random() * (999 - 100 + 1) + 100);
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

setInterval(function () {
  if (nodeIsLeader) {
    var nowHour = new Date().getHours();
    var randomAppNode1 = Math.floor(Math.random() * (999 - 100 + 1) + 100);
    var randomAppNode2 = Math.floor(Math.random() * (999 - 100 + 1) + 100);
    if (nowHour >= 16 && nowHour < 18 && !hasScaledUp) {
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
      hasScaledUp = true;
    }
    if (nowHour < 16 && nowHour >= 18 && hasScaledUp) {
      const nodeToDelete1 = "AppNode" + nodeList.slice(-1)[0].hostname.substring(3);
      const nodeToDelete2 = "AppNode" + nodeList.slice(-2)[0].hostname.substring(3);
      removeContainer(nodeToDelete1);
      removeContainer(nodeToDelete2);
      hasScaledUp = false;
    }
  }
}, 5000);
