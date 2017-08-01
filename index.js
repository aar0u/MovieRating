var express = require('express');
var shaw = require('./shaw');
var dysfz = require('./dysfz');
var db = require('./dblowdb');

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
    //get update
    dysfz(req);

    //atom feed
    dysfz.feed(req, res);

    //setTimeout(shaw.getScore, 1000);
});

app.get('/dysfz', function (req, res) {
    //atom feed
    dysfz.feed(req, res);
});

app.get('/noti', function (req, res) {
    res.type('text');
    res.send(db.noti());
});

//routes from separated file
shaw.service(app);

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
