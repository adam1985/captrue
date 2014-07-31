var nodeCsv = require('node-csv'),
    lineReader = require('line-reader'),
    readJson = require('./readJson'),
    tools = require('./tools');



var getFilmList = function( workPath, cb, type){
     var objState = {}, content = '', resList = [], againIndex;
     if( type == 'again' ) {
         var successList = readJson(workPath + 'success.txt');
         var noneresList = readJson(workPath + 'noneres.txt');
         var readyList = readyList.concat(successList, noneresList);
         readyList = readyList.sort(function(a, b){return a.index - b.index });
         againIndex = readyList[readyList.length-1].index;

         readyList.forEach(function(v){
             objState[tools.trim(v)] = 1;
         });
     }

     lineReader.eachLine(workPath + 'filmlist.txt', function(line) {
         content += line;
     }).then(function () {
         if( content ) {

             var contentArr =  content.split(/\r\n/);

             contentArr.forEach(function(v, i){
                 var filmName = tools.trim(v);
                 if( filmName && !objState[filmName]) {
                     resList.push( filmName );
                 }

             });
         }

         cb && cb( resList, againIndex );
     });
 };

module.exports = getFilmList;
