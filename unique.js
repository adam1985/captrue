/**
 * 使用命令
 *  node unique [filename]
 *
 */

var sys = require('sys'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    fork = require('child_process').fork,
    dateFormat = require('./module/dateFormat'),
    urlencode = require('urlencode'),
    net = require('net'),
    tools = require('./module/tools'),
    readJson = require('./module/readJson'),
    Deferred = require( "JQDeferred"),
    phantom;


var arguments = process.argv.splice(2) || [];

if( arguments.length < 1 ){
    throw new Error('至少需要一个参数');
}

arguments.forEach(function(v){
    readJson(v, function(list){
        var insertStr = '';
        list = tools.unique(list, true, 'name');
        list.forEach(function(v){
            insertStr += JSON.stringify(v) + '\r\n';
        });
        fs.writeFileSync(v, insertStr);

    }, 'json');
});








