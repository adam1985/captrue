/**
 * 使用命令
 *  node merge [filename, filename,...]
 *
 */

var sys = require('sys'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    path = require('path'),
    readJson = require('./module/readJson');

var dirPath = './create/',
    backupPath = './backup/',
    isComplete = false;

/**
 * 处理参数
 * @type {Array}
 */

var args = process.argv.splice(2), isMerge = args.length;

var inArray = function(arr, val){
        var _inArray = false;
        arr.forEach(function(v){
            if( val.indexOf( v ) != -1 ) {
                _inArray = true;
            }
        });

    return _inArray;
};


var dirExp = /create\W\d+\Wdata/;

function mergeInterface (dirname, filelists, cb) {
    var arg = arguments, count = 0;
    filelists.forEach(function(v){
        if( fs.existsSync(dirPath + v + '.txt') ) {
            fs.unlinkSync(dirPath + v + '.txt');
        }
    });
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

                                    readJson(filename, function(targetList){

                                        targetList.forEach(function(v, i){
                                            if( !fs.existsSync( dirPath + basename ) ){
                                                fs.writeFileSync(dirPath + basename, JSON.stringify(v) + '\r\n');
                                            } else {
                                                fs.appendFileSync(dirPath + basename, JSON.stringify(v) + '\r\n');
                                            }
                                        });

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

if( isMerge ) {
    console.log('开始合并接口文件');
    mergeInterface(dirPath, args, function(){});
} else {
    console.log('开始排序接口文件');
    ["success", "noneres"].forEach(function(v){
        if( !/baiduindex/i.test(v)){
            var path = dirPath + v + '.txt';
            if( fs.existsSync(path) ) {
                readJson(path, function(targetList){
                    targetList = targetList.sort(function(a, b){
                        return a.index - b.index;
                    });
                    targetList.forEach(function(v, i){
                        if( i == 0 ){
                            fs.writeFileSync(path, JSON.stringify(v) + '\r\n');
                        } else {
                            fs.appendFileSync(path, JSON.stringify(v) + '\r\n');
                        }
                    })

                }, 'json');
            }
        }
    });
}

process.on('exit',function(){
    if( isMerge ) {
        console.log('接口文件合并完成!');
    } else {
        console.log('接口文件排序完成!');
    }


});














