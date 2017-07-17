var request = require('request');
var feed = require('feed');
var pushbullet = require('./push');
var pool = require('./pgpool');

module.exports = dysfz;

var regex = /<h2><a target="_blank" href="(.+?)">(.+?)<\/a><\/h2>[\s\S]+?"des clearfix">([\s\S]+?)\s*<a class="pic fl"[\s\S]+?更新: <span>(.+?)<\/span>/g;
var regexArticle = /<div class="detail"[\s\S]+?<\/div>([\s\S]+)<div class="bdsharebuttonbox/g;

var currentDate = new Date();

function dysfz(req) {
    request('http://www.dysfz.cc', function (error, response, body) {
        var userAgent = req.headers['user-agent'];
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (error || (response && response.statusCode != 200)) {
            console.log('error:', error);
            console.log('statusCode:', response && response.statusCode);
            console.log('body:', body);
        }

        var count = 0, countProceed = 0, countTotal;
        while (match = regex.exec(body)) {
            (function (theMatch) {
                var url = theMatch[1];
                //https://stackoverflow.com/questions/1499889/remove-html-tags-in-javascript-with-regex
                var title = theMatch[2] + theMatch[3].replace(/(<([^>]+)>)/ig, '');
                var articleDate = new Date(theMatch[4]);
                if (articleDate > currentDate) {
                    articleDate = currentDate;
                }
                console.log(url);
                count++;
                pool.query('SELECT 1 FROM movies WHERE url=$1', [url], function (err, res) {
                    if (err) {
                        console.log(err.stack);
                    } else if (res.rowCount == 0) {
                        request(url, function (articleError, articleResponse, articleBody) {
                            console.log('get content ' + url);

                            if (error) {
                                return console.error('failed:', error);
                            }
                            articleBody = articleBody.replace(/style="[^"]{20,}?"/g, '');
                            if (articleMatch = regexArticle.exec(articleBody)) {
                                console.log(this.href);
                                var content = articleMatch[1];

                                pool.query('INSERT INTO movies(url, title, content, updated) SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM movies WHERE url=$1);',
                                    [url, title, content, articleDate], function (err, res) {
                                        if (err) {
                                            console.log(err.stack);
                                        } else if (res.rowCount > 0) {
                                            console.log("rowCount " + res.rowCount);
                                            pushbullet(userAgent, title + " - " + url);
                                        }
                                    });
                            }
                        });
                    }
                    countProceed++;
                    if (countProceed == countTotal) {
                        console.log("countTotal " + countTotal);

                        //sent to another service
                        pushbullet(userAgent, ip + ' ' + userAgent); //.slice(0, -2)
                    }
                });
            })(match);
        }
        countTotal = count++;
    });
}

dysfz.feed = function (req, res) {
    pool.query('SELECT * FROM movies ORDER BY updated DESC LIMIT 15;', function (err, result) {
        if (err) {
            console.log(err.stack);
        } else {
            var userAgent = req.headers['user-agent'];
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            console.log(ip + ' ' + userAgent + ' feed');
            var feedOut = new feed({
                title: 'dysfz',
                id: 'dysfz',
                updated: currentDate,
                favicon: 'https://qapla.herokuapp.com/favicon.ico'
            });

            for (var i = 0; i < result.rows.length; i++) {
                var obj = result.rows[i];
                feedOut.addItem({
                    title: obj.title,
                    id: obj.url,
                    link: obj.url,
                    content: obj.content,
                    date: obj.updated
                });
            }

            var atom1 = feedOut.atom1();
            res.send(atom1);
        }
    });
};