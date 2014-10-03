// --- Require Dependencies ----------------------------------------------------

var fs = require('fs');
var koa = require('koa');
var router = require('koa-router');
var serve = require('koa-static');
var body = require('koa-body');
var r = require('rethinkdb');
var Promise = require('bluebird');

var persistence = require('./persistence.js');

var Utils = require('./utils');

var app = koa();
app.use(serve('./client'));
app.use(body());
app.use(router(app));
app.get('/', function*() {
    this.body = {message: "Shouldn't see this!"};
});

/* TODO: you really wouldn't want to expose this "resource"
app.get('/bootstrap', function*(next) {
    persistence.bootstrap();
    this.body = "database reset"
});
*/

// TODO: make handler methods gracefully handle exceptions
// TODO: make responses sensible in error cases e.g. http://www.restapitutorial.com/lessons/httpmethods.html
// Export a resource for each entity

var courseServiceConfiguration = {
    name: "courses"
};

[courseServiceConfiguration].forEach(function(serviceConfig) {

    var resourceName = serviceConfig.name;

    var resourceNameSingular = resourceName.substr(0, resourceName.length-1);

    app.get('/' + resourceName + '/', function*(next) {
        var results = null;

        var searchParams = {};
        for(var name in this.query) {
            searchParams[name] = this.query[name];
        }
        /*
         * If params are provided then assume this is a search a pass the params along to the data access layer.
         * Otherwise, just call DAO getAll()
         */
        if (Utils.isEmpty(searchParams)) {
            results = yield persistence.Course.getAll();
        } else {
            results = yield persistence.Course.getSome(searchParams);
        }

        this.body = results;
    });

    app.get('/' + resourceName + '/:id', function*(next) {
        try {
            var results = yield persistence.Course.get(this.params.id)
        } catch (err) {
            this.status = 404;
            this.body = err;
            return;
        }

        this.body = results;
    });

    // PUT to /<resource>/:id to update
    app.put('/' + resourceName + '/:id', function*(next) {
        // validate that the ID matches that of the object
        if ( ! (this.params.id === this.request.body.id)) {
            this.response.status = 422;
            this.response.body = "identifier mismatch between resource location and " + resourceNameSingular;
            return;
        }

        var result = yield persistence.Course.update(this.request.body);

        if (!result) {
            this.response.status = 404;
            this.response.body = "not found: " + result;
        }

        this.body = "updated " + resourceNameSingular + " " + this.params.id;
    });

    // DELETE to /<resource>/:id to delete
    app.delete('/' + resourceName + '/:id', function*(next) {
        var result = yield persistence.Course.delete(this.params.id);

        if (!result) {
            this.response.status = 404;
            this.response.body = "not found: " + result;
        }

        this.body = "deleted " + resourceNameSingular + " " + this.params.id;
    });
});


var server = require('http').Server(app.callback());
server.listen(3000);
console.log('Listening at localhost:3000');
