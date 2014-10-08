'use strict;'

var r = require('rethinkdb'),
    assert = require('assert');

var util = require('util');

var Promise = require('bluebird')

var connection;

var dbConfig = {
    host: process.env.RDB_HOST || 'localhost',
    port: parseInt(process.env.RDB_PORT) || 28015,
    db: process.env.RDB_DB || 'Curriculum'
};

var onConnect = function onConnect(callback) {

    util.log("Connecting to database " + dbConfig.host + ":" + dbConfig.port);

    r.connect(dbConfig, function (err, c) {
        assert.ok(err === null, err);
        callback(err, c);
    });
}

// TODO: this should init at startup, but someone could conceivably make a call before it's inited -- use a Promise
onConnect(function(err, conn) {
    connection = conn;
})

/**
 * Clobber and rebuild the database and tables. 
 */
var DBInit = function () {
    var data = require("../test/data.js");
    return {
        "initialize" : function () {
            r.connect(dbConfig, function(err, conn) {
                if (err) {
                    util.log("Could not connection to initialize the database: %s", err.message);
                    process.exit(1);
                }

		        connection = conn;

                util.log("Dropping database " + dbConfig.db);

                r.dbDrop(dbConfig.db).run(conn, function(err) {
                    if (err) {
                        console.error("Could not drop the database: %s", err);
                    }
                });

                util.log("Creating database " + dbConfig.db);
                r.dbCreate(dbConfig.db).run(conn, function(err) {
                    if (err) {
                        console.error("Could not create database: %s", err);
                    }
                });

                util.log("Creating table courses");
                r.tableCreate("courses").run(conn, function(err) {
                    if (err) {
                         console.error("Could not create table: %s", err);
                    }
                });

                util.log("Adding course data.");
                data.courses.forEach(function(course) {
                     exports.Course.create(course);
                });
            });
        }	
    }
};

exports.DBInit = DBInit();

/**
 * Boiler plate code for creating boilerplate data access objects.
 * @param table The name of the table.
 */
var DataAccess = function (table) {
    // TODO: validate object structure for all functions accepting courses as args.  Need a callback for that.
    
    return {
        /**
         * Gets an entity by its id.
         * @param id
         * @returns {Promise} which contains the entity if it exists.
         */
        "get": function(id) {
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
        /**
         * Gets a list of entities which match the given search params.
         * TODO: Maybe update to accommodate an operator which determines how the filter should be applied for each param
         * (e.g. startsWith, endsWith, containts).
         *
         * @param searchParams A map where the key is the property name of the entity and the value is the value is the
         * value to filter by.
         * @returns {Promise} which contains the search results.
         */
        "getSome": function(searchParams) {
            return new Promise(function(resolve, reject) {
                //  Dynamically build a search from query params
                //  FIXME: This opens a security hole big as Dallas. Should probably limit
                //  properties that can be included in request params for a particular service/table.
                var query = r.table(table);
                for (key in searchParams){
                    query = query.filter(function(course) {
                        return course(key).match(searchParams[key]);
                    });
                }
                query = query.orderBy('title'); // Just reminding myself that I could do this if I wanted to.
                query.run(connection, function(err, cursor) {
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
        /**
         * Gets all rows in the table.
         */
        "getAll": function() {
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
        /**
         * Create a new record.
         */
        "create": function(entity) {
                return new Promise(function(resolve, reject) {
                    r.table(table).insert(entity).run(connection, function(err, result) {
                        if (err) reject(err);
                        console.log(result);
                        if (result.inserted == 1) {
                            resolve(result);
                        } else {
                            reject(result);
                        }
                    });
                });
        },
        /**
         * Update an exiting record. 
         */
        "update": function(entity) {
            return new Promise(function(resolve, reject) {
                // what happens if there is no course with the given ID?
                r.table(table).get(entity.id).replace(course).run(connection, function(err, result) {
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
        /**
         * Deletes an entity.
         * @param id of the entity to delete.
         */
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
