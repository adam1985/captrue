/**
 * 使用命令
 *  node merge [filename, filename,...]
 *
 */

var sys = require('sys'),
    fs = require('fs'),
    path = require('path'),
    readJson = require('./module/readJson');

var dirPath = './create/',
    backupPath = './backup/';

/**
 * 处理参数
 * @type {Array}
 */

var args = process.argv.splice(2);
    if( args.length < 1 ){
        throw new Error('至少需要一个参数');
    }

var inArray = function(arr, val){
        var _inArray = false;
        arr.forEach(function(v){
            if( val.indexOf( v ) != -1 ) {
                _inArray = true;
            }
        });

    return _inArray;
};


var dirExp = /create\/\d+\/data/;

function mergeInterface (dirname, filelists, cb) {
    var arg = arguments, count = 0;
    fs.readdir(dirname, function(err, basenames) {
        count = basenames.length;
        if (count > 0) {
            basenames.forEach(function (basename) {
                var filename = path.join(dirname, basename);
                fs.stat(filename, function (err, stats) {
                    if (err) { throw err; }

                    if (stats.isFile()) {
                        if( dirExp.test( dirname ) && inArray( filelists, basename ) ) {
                            if( /baiduindex/.test( basename ) ) {
                                readJson(filename, function(list){
                                    list.forEach(function(v){
                                        if( fs.existsSync( dirPath + basename ) ){
                                            fs.appendFileSync(dirPath + basename, v + '\r\n');
                                        } else {
                                            fs.writeFileSync(dirPath + basename, v + '\r\n');
                                        }
                                    });

                                });
                            } else {
                                readJson(dirPath + basename, function(sourceList){
                                    readJson(filename, function(targetList){
                                        var readyList = [].concat(sourceList, targetList);
                                        readyList = readyList.sort(function(a, b){
                                            return a.index - b.index;
                                        });

                                        readyList.forEach(function(v, i){
                                            if( i == 0 || fs.existsSync( dirPath + basename ) ){
                                                fs.writeFileSync(dirPath + basename, v + '\r\n');
                                            } else {
                                                fs.appendFileSync(dirPath + basename, v + '\r\n');
                                            }
                                        });

                                    }, 'json');
                                }, 'json');
                            }
                        }
                    } else if (stats.isDirectory()) {
                        arg.callee( filename, filelists, cb );
                    }
                });
            });
        }

    });
}

mergeInterface(dirPath, args, function(){
    console.log('接口文件合并结束!');
});














