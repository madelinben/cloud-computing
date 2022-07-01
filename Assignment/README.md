# 6130CompAssignment
Repository for NotFLIX Ltd. Scalable web application.

# Installation of Docker and Windows Terminal 
To run the solution you must first install Docker for desktop and windows-terminal. Links can be found below.
- https://docs.docker.com/desktop/windows/install/ (There is a comprehensive guide to installing this which is simple to follow)
- https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701?activetab=pivot:overviewtab 

# VS Code Extensions
The two VS Code extensions which work with this solution are the 'REST Client' by Huachao Mao and 'MongoDB for VS Code' by MongoDB.
- These can both be installed from the market place in VS Code.

# Enable WSL Integration
To allow the Axios library to spin up containers using Docker you must enable WSL integration. To do this you must:
1) Open Docker Desktop and click the settings icon at the top.
2) Click the resources tab and click "WSL Integration" from the drop down list.
3) Tick the checkbox for enabling integration with my default WSL distro and make sure enable integration with additional distros is ticked for Ubuntu.
4) Click apply and restart.

# Running the solution
1) Open Windows Terminal and open a new tab in Ubuntu
2) Create a directory where you wish to clone the repository (mkdir "directoryname");
3) Navigate into the directory (cd "directoryname") and then run the command ("git clone https://www.github.com/Aecooolh1998/6130CompAssignment") this will clone my repository
inside of the directory which has been created.
4) Navigate into the directory and run the command "sudo docker-compose build" to build the images in the docker-compose.yaml file.
4) Once done run the command "sudo docker-compose up" this will spin up the containers and run three instances of my solution running the app.js file.
5) You should now see the application building and begin to run once the set up containers are finished running and RabbitMQ has started.
7) You can verify this by opening Docker Desktop and clicking on the "Containers / Apps" tab, which will show the running solution which can be expanded to view the running containers.
8) You can also click into a specific container in Docker Desktop and see what it is broadcasting to the console.

###### Tests ######

# MongoDB Tests
1) Open up MongoDB and connect using the connection string 'mongodb://localmongo1:27017,localmongo2:27017,localmongo3:27017/notFlixDB?replicaSet=rs0' (You may have an issue here where it cannot connect to MongoDB this can be fixed by adding '127.0.0.1 localmongo1' to your hosts file in 'C:\Windows\System32\drivers\etc')
2) Once Connected you can create a playground in order to select the notFLIXDB database and insert data, an example playground is found and can be run from mongo-tests/playground.mongodb
3) Next if you open up the mongo-tests/express.http file you will see two HTTP requests which can be sent the REST Client will allow you to 'Send Request'.
4) Clicking 'Send Request' on the GET endpoint will return all the data in the database.
5) Clicking 'Send Request' on the POST endpoint will add a new record to the database. If the post fails, it is because the set up ID number already exists, so giving it a number that is not already returned from the GET will fix this. 
5) Everytime you perform one of these actions you will see the request happen in the terminal too.

# Communication between Nodes
1) When a node starts you will see "Waiting for messages in %s. To exit press CTRL+C" logged to the console.
2) Each node will then add its self to its own node list and broadcast it is alive to the other nodes.
3) Once a node recieves the message, it will then broadcast the list of alive nodes and update the time it last recieved a message from a node.
4) You can verify this by viewing the console output in your terminal, or click into a single container in Docker Desktop and view its single output observing that the 'lastMessage' property has updated.

# Leadership Election
1) The leading node outputs to the console that it is the leader
2) You can verify this by checking the console out put from the leading node "The leader is now:'app'X'' with 'X' being the nodes number.
3) You could also verify this by looking at the list of alive nodes being broadcast and checking the leader does infact have the highest ID.
3) If a node is destoryed for what ever reason and is the leader, a new node will be assigned leader automatically next time the leadership
election interval is run.

# Handling Dead Nodes
1) If a node doesn't broadcast in ten seconds, it is removed from the alive list and added to a dead nodes list, where the leader will spin up a new container.
2) You can manually kill a node in Docker Desktop by clicking the "Containers / Apps" tab, expanding the project folder and pressing the stop button on a node you wish to kill.
3) In around ten seconds time you will see a new container be created in Docker Desktop above the project folder.
4) If you click into this container you can see it is broadcasting messages to all the other nodes, and you will also see the other nodes
adding this node to the list of alive nodes and updating the messages.
5) As the new node is not part of the composition in the docker-compose.yaml file, if this starts up with a higher ID than the other nodes
then it will become the leader, but you will only see its console output if you click into that node in Docker Desktop.

# Scale Up
1) Between the hours of 4pm and 6pm the application will build two new containers as this is NotFLIX peak time. (You can change these hours in the code for testing, please note that the hours in the code are an hour behind due to Daylight Savign Time issues.
2) You can verify this by opening Docker Desktop clicking the "Containers / Apps" tab and seeing that 'AppNodeXXX' and 'AppNodeXXX' have started. Above the project folder.
3) You will also see they have been added to the array of Alive Nodes, are Broadcasting an array of all the alive nodes and the leader is stating these new nodes are alive.
4) If one of these nodes has a higher ID than the current leader, it will become the new leader automatically, but As the new node is not part of the composition in the docker-compose.yaml file, if this starts up with a higher ID than the other nodes
then it will become the leader, but you will only see its console output if you click into that node in Docker Desktop.
5) You can even stop one of these new nodes from Docker and after it hasn't broadcast a message in ten seconds then a new container will be brought up by the set interval which handles dead nodes.

# Scale Down
1) Once the peak time has been exceeded, and the application has already been scaled then the last two nodes in the array will be removed and killed.
This stops them from being brought back up again from the setinterval which handles dead nodes.
2) You can test this by running the application between 4pm and 6pm watching the containers scale up in Docker Desktop then scale down once 6pm is exceeded.
3) Or you can test it by manually setting the 'nowHours' value to exeed their peak time and set the hasScaledUp value to true
this will force jump into this code block, remove two containers and then set the hasScaledUp value back to true to stop it looping.

###### Tests End ######