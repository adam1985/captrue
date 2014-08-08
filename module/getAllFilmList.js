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
                                 type : filmType,
                                 name : filmName
                             });
                         }
                     }
                 }
             }).on('end', function() {
                 mlist = tools.unique(mlist, true, 'name');
                 mlist.forEach(function(v, i){
                     mlist[i].index = i;
                 });
                 cb && cb( mlist );
             });
         }, 'json');

     }, 'json');

 };

module.exports = getAllFilmList;
