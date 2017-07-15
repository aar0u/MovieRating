var express = require('express');
var request = require('request');
var app = express();
const Feed = require('feed');
var pushbullet = require('./push');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (request, response) {
    response.render('pages/index');
});

var regex = /<h2><a target="_blank" href="(.+?)">(.+?)<\/a><\/h2>[\s\S]+?"des clearfix">([\s\S]+?)\s*<a class="pic fl"[\s\S]+?更新: <span>(.+?)<\/span>/g;
var regexArticle = /<div class="detail"[\s\S]+?<\/div>([\s\S]+)<div class="bdsharebuttonbox/g;

require('./shaw')(app);

app.get('/dysfz', function (req, res) {
    var userAgent = req.headers['user-agent'];
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var date = new Date();
    var feed = new Feed({
        title: 'dysfz',
        id: 'dysfz',
        updated: date,
        favicon: 'https://qapla.herokuapp.com/favicon.ico'
    });

    request('http://www.dysfz.cc', function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log('body:', body); // Print the HTML for the Google homepage.
        var count = 0, countFinal, countDone = 0;
        var real = 0;
        var contentStr = ip + ' ' + userAgent;
        while (match = regex.exec(body)) {
            (function (theMatch) {
                count++;
                var url = theMatch[1];
                //https://stackoverflow.com/questions/1499889/remove-html-tags-in-javascript-with-regex
                var title = theMatch[2] + theMatch[3].replace(/(<([^>]+)>)/ig, '');
                var articleDate = new Date(theMatch[4]);
                if (articleDate > date) {
                    articleDate = date;
                }
                console.log(url);
                request(url, function (articleError, articleResponse, articleBody) {
                    countDone++;
                    console.log("doing " + countDone);
                    if (error) {
                        return console.error('failed:', error);
                    }

                    articleBody = articleBody.replace(/style="[^"]{38,}?"/g, '');
                    if (articleMatch = regexArticle.exec(articleBody)) {
                        real++;
                        console.log(this.href);
                        contentStr += "\n\n" + title + " - " + url;
                        feed.addItem({
                            title: title,
                            id: url,
                            link: url,
                            content: articleMatch[1],
                            date: articleDate
                        });
                    }

                    if (countFinal == countDone) {
                        console.log("countMatch " + real);
                        console.log("countFinal " + countDone);
                        var atom1 = feed.atom1();

                        //sent to another service
                        pushbullet(userAgent, contentStr); //.slice(0, -2)

                        res.send(atom1);
                    }
                });
            })(match);
        }
        countFinal = count;
    });
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
