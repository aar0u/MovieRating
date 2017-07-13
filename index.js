var express = require('express');
var request = require('request');
var app = express();
const Feed = require('feed');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/index', function (request, response) {
    response.render('pages/index');
});

var regex = /<h2><a target="_blank" href="(.+?)">(.+?)<\/a><\/h2>[\s\S]+?更新: <span>(.+?)<\/span>/g;
var regexArticle = /<div class="detail"[\s\S]+?<\/div>([\s\S]+)<div class="bdsharebuttonbox/g;

app.get('/', function (input, output) {
    var feed = new Feed({
        title: 'dysfz',
        id: 'dysfz',
        updated: new Date()
    });

    request('http://www.dysfz.cc', function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log('body:', body); // Print the HTML for the Google homepage.
        // var r = request.post('https://requestb.in/1f7r05d1', function (errorXML, responseXML, bodyXML) {
        //     console.log('error:', errorXML); // Print the error if one occurred
        //     console.log('statusCode:', responseXML && responseXML.statusCode); // Print the response status code if a response was received
        //     console.log('body:', bodyXML);
        // });
        var count = 0, countFinal, countDone = 0;
        var real = 0;
        while (match = regex.exec(body)) {
            (function (theMatch) {
                count++;
                var url = theMatch[1];
                var title = theMatch[2];
                var date = new Date(theMatch[3]);
                console.log(url);
                request(url, function (articleError, articleResponse, articleBody) {
                    countDone++;
                    console.log("current " + countDone);
                    if (error) {
                        return console.error('failed:', error);
                    }

                    articleBody = articleBody.replace(/style="[^"]{38,}?"/g, '');
                    if (articleMatch = regexArticle.exec(articleBody)) {
                        real++;
                        feed.addItem({
                            title: title,
                            id: url,
                            link: url,
                            content: articleMatch[1],
                            date: date
                        });
                    }
                    if (countFinal == countDone) {
                        console.log(real);
                        console.log("countFinal " + countDone);
                        var atom1 = feed.atom1();
                        //r.form(atom1);
                        output.send(atom1);
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
