var r = require('rethinkdb'),
    util = require('util'),
    assert = require('assert');

var Promise = require('bluebird')

var connection;

var dbConfig = {
    host: process.env.RDB_HOST || 'localhost',
    port: parseInt(process.env.RDB_PORT) || 28015,
    db: process.env.RDB_DB || 'Curriculum'
};

var onConnect = function onConnect(callback) {
    r.connect(dbConfig, function (err, connection) {
        assert.ok(err === null, err);
        connection['_id'] = Math.floor(Math.random() * 10001);
        callback(err, connection);
    });
}

// TODO: this should init at startup, but someone could conceivably make a call before it's inited -- use a Promise
onConnect(function(err, conn) {
    connection = conn;
})

var DataAccess = function (t) {
    // TODO: validate object structure for all functions accepting courses as args.  Need a callback for that.

    var table = t

    return {
        "getAll" : function() {
            return new Promise(function(resolve, reject) {
                r.table(table).run(connection, function(err, cursor) {
                    if (err) reject(err);
                    cursor.toArray(function(err, result) {
                        if (err) throw err;
                        resolve(result);
                    });
                });
            });
        },

        "getSome" : function(searchParams) {
            return new Promise(function(resolve, reject) {
                r.table(table).filter(function(doc) {

                    //for (key in searchParams){
                        //  Need to dynamically build out the request filter here ... somehow ...
                    //}

                    //  For now just assume we have a code key and use its value
                    var s = "^" + searchParam['code'];
                    return doc('code').match(s);
                }).run(connection,
                    function(err, cursor) {
                        if (err) {
                            console.log("[ERROR][%s][GET courses] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
                        }
                        else {
                            cursor.toArray(function (err, result) {
                                if (err) throw err;
                                resolve(result);
                            });
                        }
                    });
            });
        },

        "get" : function(id) {
            return new Promise(function(resolve, reject) {
                r.table(table).filter(r.row('id').eq(id)).run(connection, function(err, cursor) {
                    if (err) reject(err);
                    cursor.toArray(function(err, result) {
                        if (err) throw err;

                        if (result.length == 0) {
                            reject("none found for id " + id);
                        } else if (result.length > 1) {
                            reject("multiple results for id " + id);
                        } else {
                            resolve(result[0]);
                        }
                    });
                });
            });
        },

        "update" : function(course) {
            return new Promise(function(resolve, reject) {
                // what happens if there is no course with the given ID?
                r.table(table).get(course.id).replace(course).run(connection, function(err, result) {
                    if (err) reject(err);
                    console.log(result);
                    if (result.replaced == 1 || result.unchanged == 1) {
                        resolve(result);
                    } else {
                        reject(result);
                    }
                });
            });
        },

        "delete" : function(id) {
            return new Promise(function(resolve, reject) {
                // what happens if there is no course with the given ID?
                r.table(table).get(id).delete().run(connection, function(err, result) {
                    if (err) reject(err);
                    console.log(result);
                    if (result.deleted == 1) {
                        resolve(result);
                    } else {
                        reject(result);
                    }
                });
            });
        }
    }

};

exports.Course = DataAccess('courses');