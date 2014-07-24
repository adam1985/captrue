/**
 * 使用命令
 *  node index [proxy] [startIndex] [excuteType]
 */

var sys = require('sys'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    urlencode = require('urlencode'),
    nodeCsv = require('node-csv'),
    net = require('net'),
    iconv = require('iconv-lite'),
    dirWalker = require('./module/dirWalker'),
    dateFormat = require('./module/dateFormat'),
    info = require('./module/info'),
    base64 =  require('./module/base64.js'),
    tools = require('./module/tools');

var dirPath = './create/',
    backupPath = './backup/',
    failPath = dirPath + 'fail.txt',
    noneresPath = dirPath + 'noneres.txt',
    logerPath = dirPath + 'loger.txt',
    baiduindexFile = dirPath + 'baiduindex.txt';


/**
 * 处理参数
 * @type {Array}
 */

var getDefaultArg = function(arg, defaultArg) {
        if( typeof  arg === 'undefined') {
            arg = defaultArg;
        }
    return arg;
};

var prevLoger = info.getPrevLoger(logerPath), prevIndex = 0;

if( prevLoger.endIndex > 0) {
    if( prevLoger.endIndex >= prevLoger.length - 1 ){
        prevIndex = 0;
    } else {
        prevIndex = prevLoger.endIndex + 1;
    }
}

var arguments = process.argv.splice(2),
    targetProxy = getDefaultArg(arguments[0], 1),
    startIndex = getDefaultArg(arguments[1], prevIndex),
    excuteType = arguments[2];

    if( targetProxy == 'repair' || targetProxy == 'merge' || targetProxy == 'unique') {
        excuteType = targetProxy;
        targetProxy = 1;
    }

    if( startIndex == 'repair' || startIndex == 'merge' || startIndex == 'unique') {
        excuteType = startIndex;
        startIndex = prevIndex;
    }

var proxy = require('./proxy/proxy' + targetProxy);

var phantom,
    mlist = [],
    logerList = [],
    mnameIndex = parseInt( startIndex ),
    len = 0,
    proxyIp,
    proxyIps,
    usedIpIndex = 0,
    totalIplength = 0,
    excuteSize = 3,
    sucessNum = 0,
    failNum = 0,
    noneresNum = 0,
    proxyIpArr = [6, 2, 8, 3, 4, 1],
    proxyIpIndex = 0;

// 测试代理ip是否连接正常
var startCapture = function(ip, success, fail){
    try{
        var ipArr = ip.split(":");
        var client = net.createConnection(ipArr[1], ipArr[0]);
        client.on('connect', function () {
            success();
        });
        client.on('error', function(e) {
            fail();
        });
    } catch (e){
        fail();
    }

};

var createFile = function( path, content ) {
    var isexists = fs.existsSync(path);
    if(isexists) {
        fs.unlinkSync(path);
    }
    fs.writeFileSync(path, content);
};

//数组去重
var unique = function (data, isDeep){
    data = data || [];
    var a = {}, res = [];
    for (var i=0; i<data.length; i++) {
        var v;
        if( isDeep ) {
            v = data[i].data[0].word;
        } else {
            v = data[i];
        }

        if (typeof(a[v]) == 'undefined'){
            a[v] = 1;
            res.push( v );
        }
    }

    return res;
};


var trim = function(str) {
    return str.replace(/^\s+|\s+$/g, '');
};


//备份

dateFormat.format();
var initTime = new Date();
var dateString = initTime.format("yyyyMMddhhmmss");
spawn('cp', ["-r", dirPath, backupPath + dateString] );
console.log('成功备份数据');



// 统计
var defaultInfo = {
    startIndex : startIndex,
    endIndex : startIndex,
    excuteNum : 0,
    startTime : initTime.format("yyyy-MM-dd hh:mm:ss"),
    endTime : initTime.format("yyyy-MM-dd hh:mm:ss"),
    dur : 0,
    average : 0
};

info.createLoger( logerPath, defaultInfo, true );

console.log('start capture!!!');

// 生成百度指数数据
var createBaiduIndex = function( data ){
    var config = {
        "1" : "19岁及以下20",
        "2" : "20~29岁",
        "3" : "30~39岁",
        "4" : "40~49岁",
        "5" : "50岁及以上",
        "F" : "female",
        "M" : "male",
        "str_age" : "age",
        "str_sex" : "sex"
    };

    if( data.length >>> 0 ) {
        var result = [];
        data.forEach(function(v){
            var mname = v.word;
            if( typeof v == 'object' ) {
                tools.each(v, function(key1, val1){
                    if( typeof val1 == 'object' ){
                        tools.each( val1, function(key2, val2){
                            result.push( mname + '\t' + config[key1] + ' ' + config[key2] + ' ' + val2 + ' ' + val2 + '\r\n');
                        });
                    }
                });
            }
        });

        if(fs.existsSync(baiduindexFile)) {
            fs.appendFileSync(baiduindexFile, result.join(''));
        } else {
            createFile(baiduindexFile, result.join(''));
        }

    }

};

// 生成抓取日记
var longerIndex = 0, pathState = {};
var captureLoger = function( data, path, isSuccess){
    var resList = [];

        if( excuteType == 'repair') {
            var loggerStr = fs.readFileSync(path, 'utf8').toString();

            if( loggerStr ){
                loggerStr = trim( loggerStr );
                var loggers = JSON.parse( loggerStr );
                if( loggers.length ) {
                    var copyLoggers = loggers.concat();
                    copyLoggers.forEach(function(v, i){
                        if(i == data.index ){
                            copyLoggers.splice(i, 1);
                        }
                    });
                    fs.writeFileSync(path, JSON.stringify(copyLoggers));
                }
            }
        } else if( !isSuccess ){
            if( !pathState[path] && startIndex == 0  ) {
                createFile(path, JSON.stringify(data));
                pathState[path] = 1;
            } else {
                if(fs.existsSync(path)) {
                    fs.appendFileSync(path, JSON.stringify(data) + '\r\n');
                } else {
                    createFile(path, JSON.stringify(data) + '\r\n');
                }
            }
        }

    //记录统计

    var defaultInfo = {
        startIndex : startIndex,
        endIndex : startIndex,
        excuteNum : 0,
        startTime : initTime.format("yyyy-MM-dd hh:mm:ss"),
        endTime : initTime.format("yyyy-MM-dd hh:mm:ss"),
        dur : 0,
        average : 0
    };

    if( /noneres/i.test(path)){
        noneresNum++;
    } else if( !isSuccess ) {
        failNum++;
    } else {
        sucessNum++;
    }

    var now = new Date(),
        excuteNum = mnameIndex - defaultInfo.startIndex,
        initSec = initTime.getTime(),
        nowSec = now.getTime(),
        dur = nowSec - initSec;

    defaultInfo.endIndex = mnameIndex;
    defaultInfo.excuteNum = mnameIndex - defaultInfo.startIndex;
    defaultInfo.length = len;
    defaultInfo.endTime = now.format("yyyy-MM-dd hh:mm:ss");
    defaultInfo.dur = dateFormat.formatSa(dur);
    defaultInfo.average = dateFormat.formatSa(parseInt(dur / excuteNum));
    defaultInfo.proxyIp = proxyIp;
    defaultInfo.usedIpIndex = usedIpIndex;
    defaultInfo.sucessNum = sucessNum;
    defaultInfo.failNum = failNum;
    defaultInfo.noneresNum = noneresNum;

    info.createLoger( logerPath, defaultInfo );

    if( !isSuccess ) {
        console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + mlist[mnameIndex] + '"错误日记已记录!');
    }

    mnameIndex++;

};

var captureState = {};
// 递归调用数据抓取
var excuteExec = function(){
    var arg = arguments, mname = mlist[mnameIndex];
        if( captureState[mnameIndex] === undefined){
            captureState[mnameIndex] = 0;
        } else {
            captureState[mnameIndex]++;
        }

        if( phantom ) {
            phantom.kill();
        }
        if(mnameIndex < len && mname){
            var commandArray =[], eachCapture = function(proxyIps){
                if( proxyIps ) {
                    proxyIp = proxyIps[usedIpIndex];
                }

                startCapture(proxyIp, function(){
                    console.log(proxyIp+':连接正常');
                    if( proxyIp ){
                        commandArray.push( '--proxy=' + proxyIp );
                        //commandArray.push( '--proxy-type=http' );
                    }

                    commandArray.push( '--output-encoding=gbk' );

                    //commandArray.push( '--script-encoding=gbk' );

                    commandArray.push( 'capture.js' );
                    commandArray.push( mnameIndex, base64.encode( urlencode( mname , 'gbk'))  );

                    //console.log( commandArray.join(' '));
                    phantom = spawn('phantomjs', commandArray, {
                        timeout : 30 * 1000
                    });

                    phantom.stdout.on('data', function (data) {
                        if( mlist[mnameIndex] ) {
                            data = data.toString();
                            var stdout = trim( data );


                            var result = {};

                            try{
                                result = JSON.parse( stdout );
                            }catch( e ){
                                console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + mlist[mnameIndex] + '"抓取失败，重新抓取');
                                if( captureState[mnameIndex] < excuteSize ) {
                                    usedIpIndex++;
                                } else {
                                    captureLoger({
                                        index : mnameIndex,
                                        name : mlist[mnameIndex],
                                        success : false
                                    }, failPath);

                                }
                                arg.callee();
                            }

                            if( result.success ) {
                                console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + mlist[mnameIndex] + '"抓取成功');
                                var content = JSON.parse( result.content );
                                createBaiduIndex( content.data );
                                if( result.complete ) {

                                    captureLoger({
                                        index : mnameIndex,
                                        name : mlist[mnameIndex],
                                        success : true
                                    }, failPath,  result.success);

                                    arg.callee();
                                }


                            } else {

                                if( result.noneres ) {
                                    console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + mlist[mnameIndex] + '"关键词未收录，没有结果!');
                                    captureLoger({
                                        index : mnameIndex,
                                        name : mlist[mnameIndex],
                                        success : false
                                    }, noneresPath);

                                } else if( result.block ) {
                                    console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+proxyIp+':代理ip被百度屏蔽!');
                                    if( captureState[mnameIndex] < excuteSize ){
                                        usedIpIndex++;
                                    } else {
                                        captureLoger({
                                            index : mnameIndex,
                                            name : mlist[mnameIndex],
                                            success : false
                                        }, failPath );

                                    }
                                }else {
                                    if( captureState[mnameIndex] < excuteSize ) {
                                        console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + mlist[mnameIndex] + '"抓取失败，重新抓取');
                                        usedIpIndex++;
                                    } else {
                                        console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + mlist[mnameIndex] + '"抓取失败，记录日记');
                                        captureLoger({
                                            index : mnameIndex,
                                            name : mlist[mnameIndex],
                                            success : false
                                        }, failPath );

                                    }
                                }
                                arg.callee();
                            }

                        }
                    });

                    phantom.stderr.on('data', function (data) {
                        console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+proxyIp+':网络连接超时!');
                        if( captureState[mnameIndex] < excuteSize ){
                            usedIpIndex++;
                        } else {
                            captureLoger({
                                index : mnameIndex,
                                name : mlist[mnameIndex],
                                success : false
                            }, failPath );

                        }
                        arg.callee();
                    });

                    phantom.on('close', function (code) {
                        phantom.stdin.end();
                    });

                }, function(){
                    console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+proxyIp+':网络连接异常!');
                    if( captureState[mnameIndex] < excuteSize ){
                        usedIpIndex++;
                    } else {
                        captureLoger({
                            index : mnameIndex,
                            name : mlist[mnameIndex],
                            success : false
                        }, failPath );

                    }

                    arg.callee();
                });
            };

			if(usedIpIndex >= totalIplength){
				usedIpIndex = 0;

                (function(){

                    var _args = arguments;
                    if( proxyIpIndex >= proxyIpArr.length ){
                        proxyIpIndex = 0;
                    }

                    var targetProxyVal = proxyIpArr[proxyIpIndex];

                    proxy = require('./proxy/proxy' + targetProxyVal);

                    proxyIpIndex++;

                    proxy.getproxy( function( data ){
                        if( !data || data.length === 0 ) {
                            var proxyIpStr = fs.readFileSync('ip.txt');
                            if(proxyIpStr){
                                proxyIps = JSON.parse(proxyIpStr);
                            }
                        } else {
                            proxyIps = data;
                        }

                        totalIplength = proxyIps.length;
                        console.log('一共抓取了' + totalIplength + '个代理ip');

                        if( totalIplength > 0 ) {
                            eachCapture( proxyIps );
                        } else {
                            _args.callee();
                        }
                    });
                }());


			} else {
                eachCapture( proxyIps );
            }

        }
};


// 抓取代理ip
proxy.getproxy( function( data ){
    if( !data || data.length === 0 ) {
        var proxyIpStr = fs.readFileSync('ip.txt');
        if(proxyIpStr){
            proxyIps = JSON.parse(proxyIpStr);
        }
    } else {
        proxyIps = data;
    }

    totalIplength = proxyIps.length;
    console.log('一共抓取了' + totalIplength + '个代理ip');

   if( excuteType ==  'repair') { // 修复模式
         var mlistRes = fs.readFileSync(failPath, 'utf8').toString();
         if( mlistRes ){
             mlistRes = trim(mlistRes);
             var mlistArr = JSON.parse( mlistRes );
             logerList = mlistArr;
             if( mlistArr.length ){
                 mlistArr.forEach( function(v){
                        if( !v.success ) {
                            mlist.push(urlencode(v.name, 'gbk'));
                        }
                 });

                 len = mlist.length;

                 createFile('mname.txt', JSON.stringify(mlist));

                 excuteExec();

             }

         }
   } else if( excuteType ==  'unique') {
       if( fs.existsSync( baiduindexFile ) ) {
            var baideindexStr = fs.readFileSync( baiduindexFile ).toString();
           if( baideindexStr ){
               var baiduindexList = baideindexStr.split(/\r\n/);
               baiduindexList.forEach(function(v, i){
                   baiduindexList[i] = JSON.parse( v );
               });

               baiduindexList = unique(baiduindexList, true);

               baiduindexList.forEach(function(v, i){
                   if( i > 0) {
                       var baiduindexContent = fs.readFileSync( baiduindexFile );
                       baiduindexContent += JSON.stringify( v ) + '\r\n';
                       fs.writeFileSync( baiduindexFile, baiduindexContent);

                   } else {
                       fs.writeFileSync( baiduindexFile, JSON.stringify( v ));
                   }

               });

           }
       } else {
           console.log('没有找到' + baiduindexFile + '文件!')
       }
   }else if( excuteType ==  'merge' ) { // 合并数据
       var dataList = '', readerIndex = 0;
       dirWalker.walk(dirPath, function(filePath){
            if(/getSocial/i.test(filePath)) {
                var interfaceContent = fs.readFileSync( filePath ).toString();

                if( interfaceContent ) {
                    var interfaceObj = JSON.parse( interfaceContent );
                    if( interfaceObj.data && interfaceObj.data.length ) {

                        interfaceContent = interfaceContent.replace(/[\r\n]/gm, '');
                        dataList += interfaceContent + '\r\n';
                        createFile(baiduindexFile, dataList);
                        readerIndex++;
                    }
                }
            }
       });



   } else { // 读取csv
           nodeCsv.each('mname.csv').on('data', function(data) {
               if( data instanceof Array && data.length ) {
                   mlist.push(trim(data[0]));
               }
           }).on('end', function() {
               var sourceLength = mlist.length;

               mlist = unique( mlist );
               len = mlist.length;
               console.log('一共有' + ( sourceLength ) + '个影片关键词，其中有' + ( sourceLength - len ) + '关键词重复，有效关键词有' + len  + '个');
               excuteExec();

           });
   }
});






