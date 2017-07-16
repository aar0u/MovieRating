var express = require('express');
var pg = require('pg');
var request = require('request');
var Feed = require('feed');
var pushbullet = require('./push');
var shaw = require('./shaw');

var app = express();
var pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

shaw.service(app);

app.get('/', function (request, response) {
    response.render('pages/index');
});

var regex = /<h2><a target="_blank" href="(.+?)">(.+?)<\/a><\/h2>[\s\S]+?"des clearfix">([\s\S]+?)\s*<a class="pic fl"[\s\S]+?更新: <span>(.+?)<\/span>/g;
var regexArticle = /<div class="detail"[\s\S]+?<\/div>([\s\S]+)<div class="bdsharebuttonbox/g;

app.get('/dysfz', function (req, res) {
    var date = new Date();
    var userAgent = req.headers['user-agent'];
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    //get update
    request('http://www.dysfz.cc', function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log('body:', body); // Print the HTML for the Google homepage.
        var countMatch = 0, countMatchDone = 0;
        var contentStr = ip + ' ' + userAgent;
        while (match = regex.exec(body)) {
            (function (theMatch) {
                var url = theMatch[1];
                //https://stackoverflow.com/questions/1499889/remove-html-tags-in-javascript-with-regex
                var title = theMatch[2] + theMatch[3].replace(/(<([^>]+)>)/ig, '');
                var articleDate = new Date(theMatch[4]);
                if (articleDate > date) {
                    articleDate = date;
                }
                console.log(url);
                request(url, function (articleError, articleResponse, articleBody) {
                    if (error) {
                        return console.error('failed:', error);
                    }

                    articleBody = articleBody.replace(/style="[^"]{20,}?"/g, '');
                    if (articleMatch = regexArticle.exec(articleBody)) {
                        countMatch++;
                        console.log(this.href);
                        var content = articleMatch[1];

                        pool.query('INSERT INTO movies(url, title, content, updated) SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM movies WHERE url=$1);',
                            [url, title, content, articleDate], function (err, res) {
                                countMatchDone++;
                                if (err) {
                                    console.log(err.stack);
                                } else {
                                    if (res.rowCount > 0) {
                                        console.log("rowCount " + res.rowCount);
                                        contentStr += "\n\n" + title + " - " + url;
                                    }
                                }
                                if (countMatch == countMatchDone) {
                                    console.log("match " + countMatch);

                                    //sent to another service
                                    pushbullet(userAgent, contentStr); //.slice(0, -2)
                                }
                            });
                    }
                });
            })(match);
        }
    });

    //atom feed
    (function (res) {
        pool.query('SELECT * FROM movies ORDER BY updated DESC LIMIT 15;', function (err, result) {
            if (err) {
                console.log(err.stack);
            } else {
                var feed = new Feed({
                    title: 'dysfz',
                    id: 'dysfz',
                    updated: date,
                    favicon: 'https://qapla.herokuapp.com/favicon.ico'
                });

                for (var i = 0; i < result.rows.length; i++) {
                    var obj = result.rows[i];
                    feed.addItem({
                        title: obj.title,
                        id: obj.url,
                        link: obj.url,
                        content: obj.content,
                        date: obj.updated
                    });
                }

                var atom1 = feed.atom1();
                res.send(atom1);
            }
        });
    })(res);

    setTimeout(shaw.getScore, 1000);
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
