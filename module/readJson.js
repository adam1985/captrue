var fs = require('fs');
var tools = require('./tools');
var lineReader = require('line-reader');
var readJson = function( path, cb, type ) {
    var resList = [],mlist = [];
    if( fs.existsSync( path ) ) {

        lineReader.eachLine(path, function(line) {
            mlist.push( tools.trim(line));
        }).then(function () {
            if( type == 'json' ) {
                mlist.forEach(function(v, i){
                    try{
                        resList.push(JSON.parse(tools.trim(v)));
                    }catch (e){
                    }
                });
            } else {
                resList = mlist;
            }

            cb && cb( resList );
        });
    } else {
        cb && cb( resList );
    }
};

module.exports = readJson;

