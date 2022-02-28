const os = require('os');
const osHost = os.hostname();
console.log(`Host: ${osHost}.`);

const fs = require('fs');
const socketFile = require('./socket.json');
// socketFile = fs.readFileSync('socket.js');
socketNodes = JSON.parse(socketFile);
console.log('Nodes config file has ' + socketNodes);
socketLeader = 0;

const zeromq = require('zeromq');
const socket = zeromq.socket('pub');
// socket.bindSync(`tcp://*:3000`);
// socket.bindSync("tcp://0.0.0.0:3000");
socket.bindSync("tcp://" + socketNodes[osHost].ip + ":3000");
console.log(`ZeroMQ publisher is bound to port ${port}.`);

app.get('/', (req,res) => {
    res.send(`Hello Virtual Machine, this is ${osHost}. ${(leader) ? 'I am the leader.' : 'I am not the leader.' }`);
});

app.listen(port, socketNodes[osHost.ip], () => {
    console.log(`Express Application listening at port ${port}.`);
});

setInterval(() => {
    console.log(`${osHost} is alive.`);
    socket.send(['status', {
        'hostname': osHost,
        'status': 'alive',
        'nodeID': Math.floor(Math.random() * (100 - 1 + 1) + 1)
    }]);
}, 500);

setInterval(() => {
    console.log(JSON.stringify(socketNodes));
    leader = 1;
    activeNodes = 0;
    Object.entries(socketNodes).forEach(([hostname,props]) => {
        console.log(JSON.stringify(hostname) + JSON.stringify(props));
        maxNodeID = nodeID;
        if (hostname != osHost) {
            if ('nodeID' in props) {
                activeNodes++;
                if (prop.nodeID > nodeID) {
                    leader = 0;
                }
            }
        }
        if ((leader == 1) && (activeNodes == (nodes.length - 1))) {
            systemLeader = 1;
        }
    });
}, 2000);

Object.entries(socketNodes).forEach(([hostname, props]) => {
    console.log(`Host: ${hostname}\n IP: ${props.ip}`);
    
    var subSockets = [];
    if (osHost != hostname) {
        tempSocket = zeromq.socket('sub');
        tempSocket.connect(`tcp://${props.ip}:3000`);
        tempSocket.subscribe('status');
        console.log(`Subscriber connected to port 3000 of ${hostname}`);

        tempSocket.on("message", (topic, message) => {
            jsonMessage = JSON.parse(message.toString("utf-8"));
            console.log(
                `From: ${hostname}`,
                `Topic: ${topic.toString('utf-8')}`,
                `Message: ${message.status}`,
                `NodeID: ${message.nodeID}`
            );

            socketNodes[hostname].nodeID = message.nodeID;
        });

        subSockets.push(tempSocket);
    }
});