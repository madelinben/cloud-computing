# 6130COMP Cloud Computing Assignment
Cloud web service utilising virtualisation and load balancing strategies on a RESTful API to distribute a large scale application.

## System Requirements

### Installation of Docker and Windows Terminal  
To run the solution you must first install Docker for desktop and windows-terminal. Links can be found below.
- https://docs.docker.com/desktop/windows/install/
- https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701?activetab=pivot:overviewtab

### WSL Integration
WSL Integration will also need to be allowed to ensure the Axios library can spin up containers. To do this, navigate to the settings icon in Docker Desktop and tick the checkbox in "WSL Integration" which is under the resources tab. Then click apply and restart.

### VS Code Extensions
In addition to this you will need the VS Code extensions 'REST Client' and 'MongoDB for VS Code' in order to test this solution.



## Enviroment Config

### Docker

Install docker using the script
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

Install Docker Compose
```bash
sudo apt install docker-compose
```



## Initialising Solution
1) Open Windows Terminal and open a new tab in Ubuntu
2) Create a directory where you wish to clone the repository (mkdir "assignment");
3) Navigate into the directory (cd "assignment") and then run the command ("git clone https://github.com/madelinben/cloud-computing") this will clone my repository
inside of the directory which has been created.
4) Navigate into the directory called "Referral" and run the command "sudo docker-compose build" to build the images in the docker-compose.yaml file.
4) Once done run the command "sudo docker-compose up" this will spin up the containers and run three instances of my solution running the app.js file.
5) You should now see the application building and begin to run once the set up containers are finished running and RabbitMQ has started.
7) You can verify this by opening Docker Desktop and clicking on the "Containers / Apps" tab, which will show the running solution which can be expanded to view the running containers.
8) You can also click into a specific container in Docker Desktop and see what it is broadcasting to the console.



# MongoDB Test
1) Open up MongoDB and connect using the connection string 'mongodb://localmongo1:27017,localmongo2:27017,localmongo3:27017/notFlixDB?replicaSet=rs0' (You may have an issue here where it cannot connect to MongoDB this can be fixed by adding '127.0.0.1 localmongo1' to your hosts file in 'C:\Windows\System32\drivers\etc')
2) Once Connected you can create a playground in order to select the BigOilDB database and insert data, an example playground is found and can be run from mongodb/BigOilDB.mongodb
3) Next if you open up the mongodb/Test.http file you will see two HTTP requests which can be sent the REST Client will allow you to 'Send Request'.
4) Clicking 'Send Request' on the GET endpoint will return all the data in the database.
5) Clicking 'Send Request' on the POST endpoint will add a new record to the database. If the post fails, it is because the set up ID number already exists, so giving it a number that is not already returned from the GET will fix this. 
5) Everytime you perform one of these actions you will see the request appear in the terminal.



# Communication between Nodes
Each node will add its self to its own node list and broadcast it through rabbitmq that it is alive to the other nodes.
The leader will then broadcast the list of alive nodes that it receives and update the time it last recieved a message from a node.
You can verify this by viewing the console output in your terminal, or click into a single container in Docker Desktop and view its single output observing that the 'lastMessage' property has updated.

# Leadership Election
The leading node outputs to the console that it is the leader.
You can verify this by checking the console out put from the leading node "The leader is now:'app'X'' with 'X' being the nodes number.
You could also verify this by looking at the list of alive nodes being broadcast and checking the leader does infact have the highest ID.
If a node is destoryed for what ever reason and is the leader, a new node will be assigned leader automatically next time the leadership
election interval is run.

# Handling Dead Nodes
If a node doesn't broadcast in ten seconds, it is removed from the alive list and added to a dead nodes list, where the leader will spin up a new container.
You can manually kill a node in Docker Desktop by clicking the "Containers / Apps" tab, expanding the project folder and pressing the stop button on a node you wish to kill.
In around ten seconds time you will see a new container be created in Docker Desktop above the project folder.
If you click into this container you can see it is broadcasting messages to all the other nodes, and you will also see the other nodes adding this node to the list of alive nodes and updating the messages.

# Scaling
Between the hours of 4pm and 6pm the application will build two new containers as this is the peak time of operation. You can verify this by opening Docker Desktop clicking the "Containers / Apps" tab and seeing the the nodes should have started.

You will also see they have been added to the array of Alive Nodes, and are Broadcasting an array of all the alive nodes and the leader is stating these new nodes are alive. A node will be automatically selected as the new leader if it has a higher ID than the current leader selected.

You can even stop one of these new nodes from Docker and after it hasn't broadcast a message in ten seconds then a new container will be brought up by the set interval which handles dead nodes.