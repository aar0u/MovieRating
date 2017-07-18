var low = require('lowdb');
var dbMovie = low('lowdbs/movie.json');
var dbShaw = low('lowdbs/shaw.json');

module.exports = db;

function db() {
    dbMovie.defaults({movies: []}).write();
    dbShaw.defaults({movies: []}).write();
};

db.exists = function (url, callback) {
    dbMovie.get('movies').find({url: url});
};

db.movieNew = function (params, callback) {

};

db.list = function (callback) {

};

db.shawUpdate = function (params, callback) {

};

db.shawNew = function (params, callback) {
    
}