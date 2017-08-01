var request = require('request');
var db = require('./dblowdb');

module.exports = function (title, content) {
    db.notiNew(content);

    var hour = new Date().getHours();
    if (hour < 20)
        return;

    var options = {
        url: 'https://api.pushbullet.com/v2/pushes',
        headers: {
            'Access-Token': 'o.5DKAmyvLxIB5oSrgx5BqXGFmlWdHUaiR',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            type: 'note',
            body: db.noti()
        })
    };
    var r = request.post(options, function (error, response, body) {
        if (error || (response && response.statusCode !== 200)) {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        }
        console.log('body:', body);
    });
};