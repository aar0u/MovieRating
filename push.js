var request = require('request');

module.exports = function (title, content) {
    var options = {
        url: 'https://api.pushbullet.com/v2/pushes',
        headers: {
            'Access-Token': 'o.5DKAmyvLxIB5oSrgx5BqXGFmlWdHUaiR',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            type: 'note',
            body: content
        })
    };
    var r = request.post(options, function (errorXML, responseXML, bodyXML) {
        console.log('error:', errorXML); // Print the error if one occurred
        console.log('statusCode:', responseXML && responseXML.statusCode); // Print the response status code if a response was received
        console.log('body:', bodyXML);
    });
}