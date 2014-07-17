var fs = require('fs');
var createLoger = function( path, data, isInit ) {
    var infos = [];
    if( fs.existsSync( path ) ) {
        try{
            infos = JSON.parse(fs.readFileSync( path));
        }catch(e){

        }
        if( isInit || infos.length === 0 ) {
            fs.writeFileSync( path, JSON.stringify(infos.concat(data)));
        } else {
            infos[infos.length-1] = data;
            fs.writeFileSync( path, JSON.stringify(infos));
        }

    } else {
        fs.writeFileSync( path, JSON.stringify(infos.concat(data)));
    }
};

var getPrevLoger = function(path){
    if( fs.existsSync( path ) ) {
        var infos = [];
        try{
            infos = JSON.parse(fs.readFileSync( path));
        }catch(e){

        }

        if( infos.length ) {
            return infos[infos.length-1];
        }
    }
    return {endIndex : 0};
};

exports.createLoger = createLoger;
exports.getPrevLoger = getPrevLoger;

