var nodeCsv = require('node-csv'),
    readJson = require('./readJson'),
    tools = require('./tools');

var mlist = [];
 var getFilmList = function( path, cb, isNew){
     var objState = {}, againIndex = 0;
     if( isNew ) {
         var resList = readJson('./create/success.txt');
         againIndex = resList[resList.length-1].index || 0;
         resList.forEach(function(v){
             objState[v] = 1;
         });
     }

     nodeCsv.each(path).on('data', function(data) {
         if( data instanceof Array && data.length ) {
             var filmType = tools.trim(data[4]),
                 filmName = tools.trim(data[5]);
             if( filmType == '电影' ) {
                 if( !objState[filmName] ) {
                     mlist.push(filmName);
                 }

             }
         }
     }).on('end', function() {
         cb && cb( mlist, againIndex );
     });
 };

module.exports = getFilmList;
