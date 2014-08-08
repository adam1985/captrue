var nodeCsv = require('node-csv'),
    lineReader = require('line-reader'),
    readJson = require('./readJson'),
    tools = require('./tools');

var inArray = function( arr, value){
    var _inArray = false;
    arr.forEach(function(v){
        if( v.name == value ) {
            _inArray = true;
            return false;
        }
    });
    return _inArray;
};

var getFilmList = function( workPath, cb, type){
     var objState = {}, resList = [], mlist = [], readyList = [], againIndex, dirPath = workPath + 'data/';

    readJson(dirPath + 'success.txt', function( successList ){
        readJson(dirPath + 'noneres.txt', function( noneresList ){
            readJson(dirPath + 'fail.txt', function( failLists ){

                if( type == 'again' ) {
                    readyList = readyList.concat(successList, noneresList, failLists);
                    readyList = readyList.sort(function(a, b){return a.index - b.index });
                    againIndex = readyList[readyList.length-1].index;
                    readyList.forEach(function(v){
                        objState[tools.trim(v.name)] = 1;
                    });
                }

                readJson(workPath + 'filmlist.txt', function( mlist ){
                    mlist.forEach(function(v){
                        var filmName = tools.trim(v.name);
                        if( filmName && !objState[filmName]) {
                            resList.push( v );
                        }
                    });

                    cb && cb( resList, againIndex );

                }, 'json');
            }, 'json');

        }, 'json');

    }, 'json');
 };

module.exports = getFilmList;
