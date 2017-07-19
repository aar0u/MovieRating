var pg = require('pg');

module.exports = db;

pg.defaults.ssl = true;
var pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

function db() {
}

db.exists = function (url, callback) {
    pool.query('SELECT 1 FROM movies WHERE url=$1', [url], function (err, res) {
        if (err) {
            console.log(err.stack);
        } else {
            callback(res.rowCount !== 0);
        }
    });
};

db.movieNew = function (params, callback) {
    pool.query('INSERT INTO movies(url, title, content, updated) SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM movies WHERE url=$1);',
        params, function (err, res) {
            if (err) {
                console.log(err.stack);
            } else if (res.rowCount > 0) {
                callback(res.rowCount)
            }
        });
};

db.list = function (callback) {
    pool.query('SELECT * FROM movies ORDER BY updated DESC LIMIT 15;', function (err, result) {
        if (err) {
            console.log(err.stack);
        } else {
            callback(result.rows);
        }
    });
};

db.shawUpdate = function (params, callback) {
    pool.query('UPDATE shaw SET name_cn=$2, score=$3, url=$4, updated=$5 WHERE name=$1 and score!=$3', params, function (err, res) {
        if (err) {
            console.log(err.stack);
        }
        else {
            callback(res.rowCount !== 0);
        }
    });
};

db.shawNew = function (params, callback) {
    var sqlInsert = 'INSERT INTO shaw(name, name_cn, score, url, updated) SELECT $1,$2,$3,$4,$5 WHERE NOT EXISTS (SELECT 1 FROM shaw WHERE name=$1);';
    pool.query(sqlInsert, params, function (err, res) {
        if (err) {
            console.log(err.stack);
        } else {
            callback(res.rowCount);
        }
    });
};

db.shawList = function (callback) {
    pool.query('SELECT * FROM shaw ORDER BY updated DESC LIMIT 15;', function (err, result) {
        if (err) {
            console.log(err.stack);
        } else {
            callback(result.rows);
        }
    });
};