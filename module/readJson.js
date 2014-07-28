var fs = require('fs');
var tools = require('./tools');
var readJosn = function( path ) {
    var resList = [];
    if( fs.existsSync( path ) ) {
        var content = fs.readFileSync(path).toString();

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
    }

    return resList;
};

module.exports = readJosn;

