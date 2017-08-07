var request = require('request');
var time = require('./util/time');
var db = require('./dbpg');

module.exports = function (title, newNoti) {
    db.notiLast(function (row) {
        var content;
        var now = new Date();
        var newContent = time.local() + ":\n" + newNoti;
        if (row) {
            var diffHours = (now - row.date_added) / 3600000;
            content = row.content + "\n\n" + newContent;
            db.notiUpdate(row.date_added, content);
            console.log("diffHours: " + diffHours + ", out: " + content);
            if (diffHours > 4) {
                push(title, content);
            }
        }
        else {
            db.notiNew(now, newContent);
        }
    });
};


function push(title, content) {
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
    var r = request.post(options, function (error, response, body) {
        if (error || (response && response.statusCode !== 200)) {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        }
        console.log('body:', body);
    });
}
