/** @jsx React.DOM */

var React = require('react')

/**
 * Course search form.
 */
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

var CourseDataTable = React.createClass({
    getInitialState: function(){
        return {data: []}
    },
    componentDidMount: function(){
        var self = this;
        $('#courseSearchResults').dataTable({
            //"sPaginationType": "bootstrap",
            "bAutoWidth": false,
            "bDestroy": true,
            "fnDrawCallback": function() {
                self.forceUpdate();
            }
        });
    },
    componentDidUpdate: function(){
        $('#courseSearchResults').dataTable({
            //"sPaginationType": "bootstrap",
            "bAutoWidth": false,
            "bDestroy": true
        });
    },
    render: function(){
        var course = this.props.data.map(function(c, index){
            return <tr><td>{c.code}</td><td>{c.title}</td></tr>
        });
        return (
            <div class="table-responsive">
                <table class="table table-bordered" id="courseSearchResults">
                    <thead>
                        <tr class="success">
                            <td>Code</td>
                            <td>Title</td>
                        </tr>
                    </thead>
                    <tbody>
						{course}
                    </tbody>
                </table>
            </div>
        )
    }
});

/* Container for a list of Courses */
var CourseBox = React.createClass({
    handleCourseSearch: function(codeSearchString) {
        var courses = this.state.data;
        this.setState({data: courses}, function() {
            $.ajax({
                url: this.props.url + "?code=" + codeSearchString,
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
    render: function() {
        return (
            <div className="courseBox">
                <h2>Courses</h2>
                <CourseSearchForm onCourseSubmit={this.handleCourseSearch} />
                <CourseDataTable data={this.state.data} />
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