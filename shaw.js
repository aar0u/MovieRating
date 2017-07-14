var request = require('request');

module.exports = function (app) {
    app.get('/shaw', function (req, res) {
        request('http://shaw.sg/sw_movie.aspx', function (error, response, body) {
            res.send(body);
        });
    });

    //other routes..
};