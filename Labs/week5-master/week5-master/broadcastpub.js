var amqp = require('amqplib/callback_api');
amqp.connect('amqp://test:test@172.16.70.30', function(error0, connection) {});
amqp.connect('amqp://test:test@172.16.70.30', function(error0, connection) {
      if (error0) {
              throw error0;
            }
      connection.createChannel(function(error1, channel) {});
});

amqp.connect('amqp://test:test@172.16.70.30', function(error0, connection) {

if (error0) {
        throw error0;
      }
      connection.createChannel(function(error1, channel) {
              if (error1) {
                        throw error1;
                      }
              var exchange = 'logs';
              var msg =  'Hello World!';

              channel.assertExchange(exchange, 'fanout', {
                        durable: false
                      });
              channel.publish(exchange, '', Buffer.from(msg));
              console.log(" [x] Sent %s", msg);
            });





    setTimeout(function() {
              connection.close();
              }, 500);
});
