var request = require('request');
var pg = require('pg');
var pushbullet = require('./push');

pg.defaults.ssl = true;

var regexList = /<option value=".+?">\s+([\s\S]+?)\s+<\/option>/g;

module.exports = function (app) {
    app.get('/shaw', function (req, res) {
        request('http://shaw.sg/sw_movie.aspx', function (error, response, body) {
            body = /<select name="FilmCode"[\s\S]+?<\/select>/g.exec(body)[0];

            while (match = regexList.exec(body)) {
                var nameMatch = match[1].replace(/(\s*\[([^>]+)])/ig, '');
                (function (name) {
                    request('http://api.douban.com/v2/movie/search?q=' + name, function (errorDouban, responseDouban, bodyDouban) {
                        console.log('error:', errorDouban); // Print the error if one occurred
                        console.log('statusCode:', responseDouban && responseDouban.statusCode); // Print the response status code if a response was received
                        var jsonObj = JSON.parse(bodyDouban);
                        if (typeof jsonObj.subjects == "undefined") {
                            console.log('body:', bodyDouban);
                            return;
                        }
                        var info = jsonObj.subjects.filter(function (subject) {
                            return subject.year >= new Date().getFullYear() - 1  //filter out older than last year
                        })[0];

                        var client = new pg.Client({
                            connectionString: process.env.DATABASE_URL,
                        });
                        client.connect();
                        var params = [name, info.rating.average, info.alt];
                        client.query('UPDATE shaw SET score=$2, url=$3 WHERE name=$1 and score!=$2', params, function (err, res) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                if (res.rowCount == 1) {
                                    console.log("update " + params);
                                    pushbullet("shaw", params);
                                    client.end();
                                }
                                else if (res.rowCount == 0) {
                                    var sqlInsert = 'INSERT INTO shaw(name, score, url) SELECT $1,$2,$3 WHERE NOT EXISTS (SELECT 1 FROM shaw WHERE name=$1);';
                                    client.query(sqlInsert, params, function (errInsert, resInsert) {
                                        if (errInsert) {
                                            console.error(errInsert);
                                        }
                                        else if (resInsert.rowCount == 1) {
                                            console.log("insert " + params);
                                            pushbullet("shaw", params);
                                        } else {
                                            console.log("no update " + params);
                                        }
                                        client.end();
                                    });
                                }
                            }
                        });
                    });
                })(nameMatch);
            }


            // while (match = regexList.exec(body)) {
            //     console.log(match[1].replace(/(\s*\[([^>]+)])/ig, ''));
            // }
            res.send("ok");
        });
    });

    //other routes..
};