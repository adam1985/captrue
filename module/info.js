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
        readJson(path, function( list ){
            infos = list;
            infos[infos.length - 1] = data;
            var logerStr = '';
            infos.forEach(function (v) {
                logerStr += JSON.stringify(v) + '\r\n';
            });
            fs.writeFileSync(path, logerStr);

        }, 'json');
    }
};

var getPrevLoger = function(path){
    if( fs.existsSync( path ) ) {
        var infos = [], prevDef = {endIndex : 0};

        var logerListStr = fs.readFileSync( path ).toString();

        if( logerListStr ){
            var logerList = logerListStr.split('\r\n');
            logerList.forEach(function(v){
                try{
                    infos.push(JSON.parse(v));
                }catch(e){

                }
            });
            if( infos.length ) {
                prevDef = infos[infos.length-1];
            }

        }

    }
    return prevDef;

};

exports.createLoger = createLoger;
exports.getPrevLoger = getPrevLoger;

