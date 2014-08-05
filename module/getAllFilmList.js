var nodeCsv = require('node-csv'),
    readJson = require('./readJson'),
    tools = require('./tools');

var mlist = [], dirPath = './create/';
 var getAllFilmList = function( path, filter , cb){
     var objState = {}, readyList = [], filmIndex = 0;


     readJson(dirPath + 'success.txt', function( successList ){
         readJson(dirPath + 'noneres.txt', function( noneresList ){
             readyList = readyList.concat(successList, noneresList);
             readyList.forEach(function(v){
                 objState[tools.trim(v.name)] = 1;
             });
             nodeCsv.each(path).on('data', function(data) {
                 if( data instanceof Array && data.length ) {
                     if( filter( data ) ) {
                         var filmType = tools.trim(data[4]) || 'NULL',
                             filmName = tools.trim(data[5]);
                         if( filmName && !objState[filmName] ) {
                             mlist.push({
                                 index : filmIndex,
                                 type : filmType,
                                 name : filmName

                             });
                             filmIndex++;
                         }
                     }
                 }
             }).on('end', function() {
                 cb && cb( tools.unique(mlist, true, 'name') );
             });
         }, 'json');

     }, 'json');

 };

module.exports = getAllFilmList;
