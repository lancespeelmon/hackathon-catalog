var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var r = require('rethinkdb'),
    util = require('util'),
    assert = require('assert');

var dbConfig = {
    host: process.env.RDB_HOST || 'localhost',
    port: parseInt(process.env.RDB_PORT) || 28015,
    db: process.env.RDB_DB || 'Curriculum'
};

/*
 * Connection to the DB and run the query in the given callback.
 */
function onConnect(callback) {
    r.connect({host: dbConfig.host, port: dbConfig.port }, function (err, connection) {
        assert.ok(err === null, err);
        connection['_id'] = Math.floor(Math.random() * 10001);
        callback(err, connection);
    });
}

var courses = [];

app.use('/', express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/courses.json', function (request, response) {
    response.setHeader('Content-Type', 'application/json');

    onConnect(function (err, connection) {
        r.db(dbConfig.db).table('courses').run(connection, function (err, cursor) {
            if (err) {
                console.log("[ERROR][%s][GET courses] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
            }
            else {
                cursor.toArray(function (err, result) {
                    if (err) throw err;
                    courses = result;
                    response.send(JSON.stringify(result));
                });
            }
        });
    });
});

app.post('/courses.json', function (request, response) {

    onConnect(function (err, connection) {
        r.db(dbConfig.db).table('courses').insert({author: request.body.author, text: request.body.text}).run(connection, function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(request.body, null, 2));
        })

        r.db(dbConfig.db).table('courses').run(connection, function (err, cursor) {
            if (err) {
                console.log("[ERROR][%s][GET courses] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
            }
            else {
                cursor.toArray(function (err, result) {
                    if (err) throw err;
                    courses = result;

                    response.setHeader('Content-Type', 'application/json');

                    response.send(JSON.stringify(courses));
                });
            }
        });
    });
});

app.listen(3000);

console.log('Listening at http://localhost:3000/');
