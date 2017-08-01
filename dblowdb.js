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

db.notiNew = function (content) {
    var dbNoti = getDbNoti();
    var now = getTime();
    dbNoti.get('notis').push({[now]: content}).write();
};

db.noti = function () {
    var dbNoti = getDbNoti();
    var list = dbNoti.get('notis').value();
    return list.map(function (x) {
        var key = Object.keys(x)[0];
        return key + ":\n" + x[key];
    }).join("\n\n");
};

function getDbNoti() {
    var currentDate = getTime().slice(0, 10);
    var dbNoti = low('lowdb/' + currentDate + '.json');
    dbNoti.defaults({notis: []}).write();
    return dbNoti;
};

function getTime() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: "2-digit",
        minute: "2-digit"
    }).replace(/\//g, '-');
}