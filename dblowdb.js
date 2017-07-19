var low = require('lowdb');
var dbMovie = low('lowdb/movie.json');
var dbShaw = low('lowdb/shaw.json');

module.exports = db;

function db() {
    dbMovie.defaults({movies: []}).write();
    dbShaw.defaults({movies: []}).write();
}

db.exists = function (url, callback) {
    var entry = dbMovie.get('movies').find({url: url}).value();
    callback(entry !== undefined);
};

db.movieNew = function (params, callback) {
    dbMovie.get('movies').push({
        url: params[0],
        title: params[1],
        content: params[2],
        updated: params[3]
    }).write();
    callback(1);
};

db.list = function (callback) {
    var movies = dbMovie.get('movies')
        .sortBy('updated', 'desc')
        .take(15)
        .value();
    callback(movies);
};

db.shawUpdate = function (params, callback) {

};

db.shawNew = function (params, callback) {

};