/**
 * 使用命令
 *  node fetchIp [type]
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
    phantom;

var arguments = process.argv.splice(2);

if( arguments.length < 1 ){
    throw new Error('至少需要一个参数');
}

//备份
dateFormat.format();
var initTime = new Date();
var dateString = initTime.format("yyyyMMddhhmmss");

var proxyIpRange = {start : 1, end : 46},
    excuteType = arguments[0],
    dirname = arguments[1],
    startIndex = arguments[2] || proxyIpRange.start,
    endIndex = arguments[3] || proxyIpRange.end;




var typeState = {
        "0" : "fetch",
        "1" : "verify",
        "2" : "filter"
    },
    convertType = function( type ){
        var _type = 0;
        for(var i in typeState ){
            if( type == typeState[i]){
                _type = i;
            }
        }
        return _type;
    },
    appendFile = function( path, content ){
        var isexists = fs.existsSync(path);
        if(isexists) {
            fs.appendFileSync(path, content);
        } else {
            fs.writeFileSync(path, content);
        }
    },
    type = convertType( excuteType ),
    workPath = __dirname + '/ip/',
    onlinePath = workPath + 'online/',
    backupPath = workPath + 'backup/',
    targetPath;

    if( type == 0 ) {
        targetPath = workPath + dirname + '/';
        spawn('mkdir', [targetPath]);
    } else {
        targetPath = workPath + 'dev/';
        if( fs.existsSync(targetPath) ) {
            spawn('mv', [targetPath, backupPath + 'dev_' + dateString] );
        }

        if( fs.existsSync(onlinePath)  ){
            spawn('cp', ["-r", onlinePath, targetPath] );
        }
    }


var sourcePath = targetPath + 'source.txt',
    verifyPath = targetPath + 'verify.txt',
    formalPath = targetPath + 'formal.txt',
    failPath = targetPath + 'fail.txt',
    successPath = targetPath + 'success.txt',
    logerPath = targetPath + 'loger.txt';

if( startIndex ==  -1 ) {
    if( fs.existsSync(logerPath) ) {
        var logerListStr = fs.readFileSync(logerPath).toString(),
            logerListObj = JSON.parse( tools.trim(logerListStr)),
            prevProxyIndex = logerListObj.proxyIndex,
            prevIndex = logerListObj.index;
        startIndex = prevProxyIndex;
    } else {
        startIndex = 0;
    }
}

var proxyIndex = startIndex;


// 测试网络是否可用
var checkProxyIp = function(ip, success, fail){
        console.log(ip + ':正在检测ip是否连接正常!');
        try{
            var ipArr = ip.split(":");
            var client = net.createConnection(ipArr[1], ipArr[0]);
            client.on('connect', function () {
                console.log(ip + ':连接正常!');
                success();
            });

            client.on('error', function(e){
                console.log(ip + ':网络连接异常!');
                fail();
            });

            client.on('timeout', function(e) {
                console.log(':网络tcp连接超时!');
                fail();
            });

        } catch (e){
            console.log(ip + ':ip或端口格式不对!!');
            fail();
        }
};

var checkPageCaptrue = function( ip ,success, cb) {
    var commandArray = [];
    commandArray.push( '--proxy=' + ip );
    commandArray.push( '--output-encoding=gbk' );
    commandArray.push( 'checkProxy.js' );

    phantom = spawn('phantomjs', commandArray);

    phantom.stdout.on('data', function (data) {
        data = data.toString();

        var stdout = tools.trim(data);

        console.log(stdout);

        var result;

        if (/{.*}/i.test(stdout) && /index/i.test(stdout) && /success/i.test(stdout) && /msg/i.test(stdout)) {
            var resultStr = stdout.match(/{(.*?)}/)[0];
            try{
                result =  JSON.parse( resultStr );
            }catch( e ){

            }

            if( result ) {

                if (result.success) {
                    success();
                }
            }
        }
    });

    phantom.stderr.on('data', function (data) {
        console.log( '错误输出流!');
    });

    phantom.on('close', function (code,signal) {
        phantom.kill(signal);
    });

    phantom.on('error',function(code,signal){
        phantom.kill(signal);

    });

    phantom.on('exit',function(code,signal){
        cb();
    });

};

if( type == 0 ){

    (function(){
        var arg = arguments;
        if( proxyIndex <= endIndex ) {
            var proxy = require('./proxy/proxy' + proxyIndex);
            proxy.getproxy( function( data ){

                data.forEach(function(v){
                    readJson(sourcePath, function(sourceList){
                        if( !tools.inArray(sourceList, v, true) ) {
                            appendFile(sourcePath, JSON.stringify({name : v, type : "unverified"}) + '\r\n');
                        }
                    }, 'json');

                });
                var checkIndex = 0;
                checkIndex += prevIndex;
                prevIndex = 0;
                (function(){
                    var args = arguments, len = data.length;
                    if( checkIndex < len ) {
                        var name = data[checkIndex];
                        fs.writeFileSync(logerPath, JSON.stringify({name : name, proxyIndex : proxyIndex, index : checkIndex, length : len}));
                        checkProxyIp(name, function(){
                            readJson(verifyPath, function(verifyList){
                                if( !tools.inArray(verifyList, name, true) ) {
                                    appendFile(verifyPath, JSON.stringify({name : name, type : "verified"}) + '\r\n');
                                }
                            }, 'json');
                            checkPageCaptrue(name, function(){
                                readJson(formalPath, function(formalList){
                                    if( !tools.inArray(formalList, name, true) ) {
                                        appendFile(formalPath, JSON.stringify({name : name, type : "success"}) + '\r\n');
                                    }
                                }, 'json');
                            }, function(){
                                checkIndex++;
                                args.callee();
                            });

                        }, function(){
                            checkIndex++;
                            args.callee();
                        });
                    } else {
                        proxyIndex++;
                        arg.callee();
                    }
                }());
            });
        } else {
            console.log( '获取代理结束' );
        }
    }());

} else if( type == 1){
    var tempFormalPath = targetPath + 'temp_formal.txt',
        tempverifyPath = targetPath + 'temp_verify.txt';
    readJson(formalPath, function(formalList){
        readJson(verifyPath, function(verifyList){
        var checkIndex = 0, readyList = formalList.concat(verifyList), len = readyList.length;
            checkIndex += prevIndex;
            prevIndex = 0;
        (function(){
            var args = arguments;
            if( checkIndex < len ) {
                var name = readyList[checkIndex].name;
                fs.writeFileSync(logerPath, JSON.stringify({name : name, proxyIndex : -1, index : checkIndex, length : len}));
                checkProxyIp(name, function(){
                    readJson(tempverifyPath, function(verifyList){
                        if( !tools.inArray(verifyList, name, true) ) {
                            appendFile(tempverifyPath, JSON.stringify({name : name, type : "verified"}) + '\r\n');
                        }
                    }, 'json');
                    checkPageCaptrue(name, function(){
                        readJson(tempFormalPath, function(formalList){
                            if( !tools.inArray(formalList, name, true) ) {
                                appendFile(tempFormalPath, JSON.stringify({name : name, type : "success"}) + '\r\n');
                            }
                        }, 'json');
                    }, function(){
                        checkIndex++;
                        args.callee();
                    });
                }, function(){
                    checkIndex++;
                    args.callee();
                });
            } else {
                spawn('rm', ['-rf', verifyPath] );
                spawn('rm', ['-rf', formalPath] );
                spawn('mv', [tempverifyPath, verifyPath] );
                spawn('mv', [tempFormalPath, formalPath] );
                console.log( '验证代理结束' );
            }
        }());
        }, 'json');
    }, 'json');

} else if( type == 2 ){
    readJson(formalPath, function(formalList){
        var insertStr = '';
        readJson(failPath, function(failList){
            formalList.each(function(v){
                if( !tools.inArray(failList, v.name, true) ) {
                    insertStr += JSON.stringify(v) + '\r\n';
                }
            });
            fs.writeFileSync(formalPath, insertStr);
        }, 'json');
    }, 'json');
}






