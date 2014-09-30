/** @jsx React.DOM */

/*
 * The details of a Course.
 */
var Course = React.createClass({
    render: function() {
        return (
            <div className="course">
                <h3 className="courseDetails">
                    {this.props.title} {this.props.code}
                </h3>
            </div>
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
        courses.push(course);
        this.setState({data: courses}, function() {

            $.ajax({
                url: this.props.url,
                dataType: 'json',
                type: 'POST',
                data: course,
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
        this.loadCoursesFromServer();
    },
    render: function() {
        return (
            <div className="courseBox">
                <h1>Courses</h1>
                <CourseList data={this.state.data} />
            </div>
        );
    }
});

React.renderComponent(
    <CourseBox url="courses.json" />,
    document.getElementById('content')
);