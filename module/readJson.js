var fs = require('fs');
var tools = require('./tools');
var lineReader = require('line-reader');
var readJosn = function( path ) {
    var resList = [];
    if( fs.existsSync( path ) ) {
        var content = '';

        lineReader.eachLine(path, function(line) {
            content += line;
        }).then(function () {
            if( content ) {

                var contentArr =  content.split(/\r\n/);

                contentArr.forEach(function(v, i){

                    if(v) {
                        try{
                            resList.push( JSON.parse(tools.trim(v)) );
                        }catch (e){

                        }
                    }
                });
            }
        });
    }

    return resList;
};

module.exports = readJosn;

