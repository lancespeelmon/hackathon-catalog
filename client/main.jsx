/** @jsx React.DOM */
var React = window.React = require('react');
var Router = require('react-router')
var Route = Router.Route
var Routes = Router.Routes
var DefaultRoute = Router.DefaultRoute
var NotFoundRoute = Router.NotFoundRoute
var Link = Router.Link
var Redirect = Router.Redirect

var CourseSearch = require('./requests/curriculum.jsx')

var routes = (
    <Routes>
        <Route name="course_search" path="/course_search" handler={CourseSearch}/>
        <Redirect path="/" to="/course_search" />
    </Routes>
)

React.renderComponent(routes, document.body);
