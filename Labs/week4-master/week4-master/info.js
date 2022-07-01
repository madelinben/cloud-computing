

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
