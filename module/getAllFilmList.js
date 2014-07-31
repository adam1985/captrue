var nodeCsv = require('node-csv'),
    readJson = require('./readJson'),
    tools = require('./tools');

var mlist = [], dirPath = './create/';
 var getAllFilmList = function( path, filter , cb){
     var objState = {}, readyList = [];
     var successList = readJson(dirPath + 'success.txt');
     var noneresList = readJson(dirPath + 'noneres.txt');
     readyList = readyList.concat(successList, noneresList);

     readyList.forEach(function(v){
         objState[v] = 1;
     });

     nodeCsv.each(path).on('data', function(data) {
         if( data instanceof Array && data.length ) {
             if( filter( data ) ) {
                 var filmName = tools.trim(data[5]);
                 if( !objState[filmName] ) {
                     mlist.push(filmName);
                 }
             }
         }
     }).on('end', function() {
         cb && cb( tools.unique(mlist) );
     });
 };

module.exports = getAllFilmList;
