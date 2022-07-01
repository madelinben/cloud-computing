//import the request library
var request = require('request');

//This is the URL endopint of your vm running docker
var url = 'http://172.16.70.50:2375';


//this uses the simple get request from request
//


function containerQty(){
    request.get({
    	//we are using the /info url to get the base docker information
        url: url + "/info",
    }, (err, res, data) => {
        if (err) {
            console.log('Error:', err);
        } else if (res.statusCode !== 200) {
	        console.log('Status:', res.statusCode);
        } else{
	        //we need to parse the json response to access
            data = JSON.parse(data)
            console.log("Number of Containers = " + data.Containers);
        }
    });
}

containerQty();

//create the post object to send to the docker api to create a container
var create = {
    uri: url + "/v1.40/containers/create",
	method: 'POST',
    //deploy an alpine container that runs echo hello world
	json: {"Image": "alpine", "Cmd": ["echo", "hello world from LJMU cloud computing"]}
};

//send the create request
request(create, function (error, response, createBody) {
    if (!error) {
	    console.log("Created container " + JSON.stringify(createBody));
     
        //post object for the container start request
        var start = {
            uri: url + "/v1.40/containers/" + createBody.Id + "/start",
	      	method: 'POST',
	        json: {}
	    };
		
	    //send the start request
        request(start, function (error, response, startBody) {
	        if (!error) {
		        console.log("Container start completed");
	    
                //post object for  wait 
                var wait = {
			        uri: url + "/v1.40/containers/" + createBody.Id + "/wait",
                    method: 'POST',
		            json: {}
		        };
		   
                
			    request(wait, function (error, response, waitBody ) {
			        if (!error) {
				        console.log("run wait complete, container will have started");
			            
                        //send a simple get request for stdout from the container
                        request.get({
                            url: url + "/v1.40/containers/" + createBody.Id + "/logs?stdout=1",
                            }, (err, res, data) => {
                                    if (err) {
                                        console.log('Error:', err);
                                    } else if (res.statusCode !== 200) {
                                        console.log('Status:', res.statusCode);
                                    } else{
                                        //we need to parse the json response to access
                                        console.log("Container stdout = " + data);
                                        containerQty();
                                    }
                                });
                        }
		        });
            }
        });

    }   
});

