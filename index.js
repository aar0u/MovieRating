var express = require('express');
var shaw = require('./shaw');
var dysfz = require('./dysfz');
var db = require('./dbpg');

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    shaw.feed(function (rows) {
        res.render('pages/index', {rows: rows});
    });
});

app.get('/get_dysfz', function (req, res) {
    // get update
    dysfz(req);

    // atom feed
    dysfz.feed(req, res);

    // get shaw
    setTimeout(shaw.getScore, 1000);
});

app.get('/dysfz', function (req, res) {
    // atom feed
    dysfz.feed(req, res);
});

app.get('/noti', function (req, res) {
    res.type('text');

    db.notiList(function (notis) {
        var text;
        var now = new Date();
        text = 'now ' + now + '\n';
        if (notis[0]) {
            var diffHours = (now - notis[0].date_added) / 3600000;
            text += 'lastdate ' + notis[0].date_added +
                '\ndiff ' + diffHours + '\n' + JSON.stringify(notis, null, 4);
        } else {
            text += JSON.stringify(notis, null, 4);
        }
        res.send(text);
    });
});

// routes from separated file
shaw.service(app);

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
