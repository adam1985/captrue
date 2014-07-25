var fs = require('fs'),
    readJson = require('./readJson');
var createLoger = function( path, data, mnameIndex, isInit ) {
    if( ( isInit && mnameIndex == 0 ) ) {
        fs.writeFileSync( path, JSON.stringify(data) + '\r\n');
    } else if( isInit ) {
        if( fs.existsSync( path ) ) {
            fs.appendFileSync(path, JSON.stringify(data) + '\r\n');
        } else {
            fs.writeFileSync( path, JSON.stringify(data) + '\r\n');
        }
    } else {
        var infos = [];
        try {
            infos = readJson(path);
        } catch (e) {
            console.log(e);
        }
        infos[infos.length - 1] = data;
        var logerStr = '';
        infos.forEach(function (v) {
            logerStr += JSON.stringify(v) + '\r\n';
        });
        fs.writeFileSync(path, logerStr);
    }
};

var getPrevLoger = function(path){
    if( fs.existsSync( path ) ) {
        var infos = [];
        try{
            infos = readJson(path);
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

