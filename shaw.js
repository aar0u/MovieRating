var request = require('request');
var pg = require('pg');
var pushbullet = require('./push');

pg.defaults.ssl = true;

var regexList = /<option value=".+?">\s+([\s\S]+?)\s+<\/option>/g;

module.exports = {
    service: function (app) {
        app.get('/shaw', function (req, res) {
            module.exports.getScore();
            res.send("ok");
        });

        //other routes..
    },

    getScore: function () {
        request('http://shaw.sg/sw_movie.aspx', function (error, response, body) {
            body = /<select name="FilmCode"[\s\S]+?<\/select>/g.exec(body)[0];

            // var i = 0;
            while (match = regexList.exec(body)) {
                // if (i > 0) break;
                // i++;
                var nameMatch = match[1].replace(/(\s*\[([^>]+)])/ig, '');
                (function (name) {
                    request('http://api.douban.com/v2/movie/search?q=' + name, function (errorDouban, responseDouban, bodyDouban) {
                        if (errorDouban || (responseDouban && responseDouban.statusCode != 200)) {
                            console.log('error:', errorDouban);
                            console.log('statusCode:', responseDouban && responseDouban.statusCode);
                        }
                        var jsonObj = JSON.parse(bodyDouban);
                        if (typeof jsonObj.subjects == "undefined") {
                            console.log('body:', bodyDouban);
                            return;
                        }
                        var info = jsonObj.subjects.filter(function (subject) {
                            return subject.year >= new Date().getFullYear() - 1  //filter out older than last year
                        })[0];

                        var params = [name, info.title, info.rating.average, info.alt];
                        // console.log(params.join('\n'));
                        // return;

                        var client = new pg.Client({
                            connectionString: process.env.DATABASE_URL,
                        });
                        client.connect();
                        client.query('UPDATE shaw SET cnname=$2, score=$3, url=$4 WHERE name=$1 and score!=$3', params, function (err, res) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                if (res.rowCount == 1) {
                                    console.log("update " + params);
                                    pushbullet("Shaw", params.join('\n'));
                                    client.end();
                                }
                                else if (res.rowCount == 0) {
                                    var sqlInsert = 'INSERT INTO shaw(name, cnname, score, url) SELECT $1,$2,$3,$4 WHERE NOT EXISTS (SELECT 1 FROM shaw WHERE name=$1);';
                                    client.query(sqlInsert, params, function (errInsert, resInsert) {
                                        if (errInsert) {
                                            console.error(errInsert);
                                        }
                                        else if (resInsert.rowCount == 1) {
                                            console.log("insert " + params);
                                            pushbullet("Shaw", params.join('\n'));
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
        });
    }
};