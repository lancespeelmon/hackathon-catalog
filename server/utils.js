/*  Determine if a map has properties. (There just has be a better way, but what the heck). */
exports.isEmpty = function (map) {
    for(var key in map) {
        if (map.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
};