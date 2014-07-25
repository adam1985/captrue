var fs = require('fs');
var readJosn = function( path ) {
    var resList = [];
    if( fs.existsSync( path ) ) {
        var content = fs.readFileSync(path).toString();

        if( content ) {
            var contentArr =  content.split(/\r\n/);
            contentArr.forEach(function(v){
                if(v) {
                    resList.push( JSON.parse(v) );
                }

            });
        }
    }


    return resList;
};

module.exports = readJosn;

