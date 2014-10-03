/** @jsx React.DOM */

var React = require('react')

/*
 * The details of a Course.
 */
var Course = React.createClass({
    render: function() {
        return (
            <div className="course">
                <h3 className="courseDetails">
                    {this.props.title} ({this.props.code})
                </h3>
            </div>
        );
    }
});

var CourseSearchForm = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();
        var searchString = this.refs.searchString.getDOMNode().value.trim();
        if (!searchString) {
            return;
        }
        //this.props.onCourseSubmit({searchString: searchString});
        this.props.onCourseSubmit(searchString);
        this.refs.searchString.getDOMNode().value = '';
        return;
    },
    render: function() {
        return (
            <form className="courseSearchForm" onSubmit={this.handleSubmit}>
                <input type="text" placeholder="Search..." ref="searchString" />
                <input type="submit" value="Search" />
            </form>
        );
    }
});

/* A list of Courses */
var CourseList = React.createClass({
    render: function() {
        var courseNodes = this.props.data.map(function(course, index) {
            return (
                <Course title={course.title} code={course.code} key={index} />
            );
        });
        return (
            <div className="courseList">
                {courseNodes}
            </div>
        );
    }
});

/* Container for a list of Courses */
var CourseBox = React.createClass({
    loadCoursesFromServer: function() {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            success: function(data) {
                this.setState({data: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    handleCourseSearch: function(course) {
        var courses = this.state.data;
        this.setState({data: courses}, function() {
            $.ajax({
                url: this.props.url + "?code=" + course,
                dataType: 'json',
                type: 'GET',
                data: courses,
                success: function(data) {
                    this.setState({data: data});
                }.bind(this),
                error: function(xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }.bind(this)
            });
        });
    },
    getInitialState: function() {
        return {data: []};
    },
    componentDidMount: function() {
        // Leaving this because I don't want to forget about it.
        //this.loadCoursesFromServer();
    },
    render: function() {
        return (
            <div className="courseBox">
                <h2>Courses</h2>
                <CourseSearchForm onCourseSubmit={this.handleCourseSearch} />
                <CourseList data={this.state.data} />
            </div>
        );
    }
});

var React = require('react')

module.exports = React.createClass({
    render: function() {
        return (
            <CourseBox url="courses" />
        );
    }
});