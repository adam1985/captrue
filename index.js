/**
 * 使用命令
 *  node index [proxy] [startIndex] [excuteType]
 */

var sys = require('sys'),
    fs = require('fs'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    urlencode = require('urlencode'),
    nodeCsv = require('node-csv'),
    cheerio = require('cheerio'),
    net = require('net'),
    dirWalker = require('./dirWalker'),
    dateFormat = require('./dateFormat'),
    info = require('./info');


var dirPath = './create/',
    backupPath = './backup/',
    baiduindex = dirPath + 'baiduindex.txt';

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

var prevLoger = info.getPrevLoger(dirPath + 'loger.txt'), prevIndex = 0;

if( prevLoger.endIndex > 0) {
    if( prevLoger.endIndex >= prevLoger.length - 1 ){
        prevIndex = 0;
    } else {
        prevIndex = prevLoger.endIndex;
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

var proxy = require('./proxy' + targetProxy);

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
	var ipArr = ip.split(":");
	var client = net.createConnection(ipArr[1], ipArr[0]);
	client.on('connect', function () {
		success();
	});
	client.on('error', function(e) {
		fail();
	});

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
    var a = {};
    for (var i=0; i<data.length; i++) {
        var v;
        if( isDeep ) {
            v = data[i].data[0].word;
        } else {
            v = data[i];
        }

        if (typeof(a[v]) == 'undefined'){
            a[v] = 1;
        }
    }
    if( Object.keys ){
        return Object.keys(a);
    }
    data.length=0;
    for (var i in a){
        data[data.length] = i;
    }
    return data;
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

info.createLoger( dirPath + 'loger.txt', defaultInfo, true );

console.log('start capture!!!');

// 生成抓取日记
var longerIndex = 0, pathState = {};
var captureLoger = function( data, path, type, isSuccess){
    var resList = [];
    if( type == 'repair' ) {
        if( excuteType == 'repair') {
            var loggerStr = fs.readFileSync(path, 'utf8').toString();

            if( loggerStr ){
                loggerStr = loggerStr.replace(/^\s+|\s+$/g, '');
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
        }
    } else {
        if( !pathState[path] && startIndex == 0  ) {
            resList.push(data);
            createFile(path, JSON.stringify(resList));
            pathState[path] = 1;
            longerIndex++;
        } else {
            if(fs.existsSync(path)) {
                resList = JSON.parse(fs.readFileSync(path, 'utf8').toString());
            }
            fs.writeFileSync(path, JSON.stringify(resList.concat( data )));
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

    info.createLoger( dirPath + 'loger.txt', defaultInfo );

    if( !isSuccess ) {
        console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"错误日记已记录!');
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
                    commandArray.push( mnameIndex );

                    phantom = spawn('phantomjs', commandArray, {
                        timeout : 60 * 1000
                    });

                    phantom.stdout.on('data', function (data) {
                        if( mlist[mnameIndex] ) {
                            data = data.toString();
                            stdout = data.replace(/^\s+|\s+$/g, '');

                            var result = {};

                            try{
                                result = JSON.parse( stdout );
                            }catch( e ){
                                console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"抓取失败，重新抓取');
                                if( captureState[mnameIndex] < excuteSize ) {
                                    usedIpIndex++;
                                } else {
                                    captureLoger({
                                        index : mnameIndex,
                                        name : urlencode.decode(mlist[mnameIndex], 'gbk'),
                                        success : false
                                    }, dirPath + 'fail.txt');

                                }
                                arg.callee();
                            }

                            if( result.success ) {
                                console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"抓取成功');

                                captureLoger({
                                    index : mnameIndex
                                }, dirPath + 'fail.txt', 'repair', result.success);


                                arg.callee();

                            } else {

                                if( result.noneres ) {
                                    console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"关键词未收录，没有结果!');
                                    captureLoger({
                                        index : mnameIndex,
                                        name : urlencode.decode(mlist[mnameIndex], 'gbk'),
                                        success : false
                                    }, dirPath + 'noneres.txt');

                                } else if( result.block ) {
                                    console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+proxyIp+':代理ip被百度屏蔽!');
                                    if( captureState[mnameIndex] < excuteSize ){
                                        usedIpIndex++;
                                    } else {
                                        captureLoger({
                                            index : mnameIndex,
                                            name : urlencode.decode(mlist[mnameIndex], 'gbk'),
                                            success : false
                                        }, dirPath + 'fail.txt' );

                                    }
                                }else {
                                    if( captureState[mnameIndex] < excuteSize ) {
                                        console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"抓取失败，重新抓取');
                                        usedIpIndex++;
                                    } else {
                                        console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"抓取失败，记录日记');
                                        captureLoger({
                                            index : mnameIndex,
                                            name : urlencode.decode(mlist[mnameIndex], 'gbk'),
                                            success : false
                                        }, dirPath + 'fail.txt' );

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
                                name : urlencode.decode(mlist[mnameIndex], 'gbk'),
                                success : false
                            }, dirPath + 'fail.txt' );

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
                            name : urlencode.decode(mlist[mnameIndex], 'gbk'),
                            success : false
                        }, dirPath + 'fail.txt' );

                    }

                    arg.callee();
                });
            };

			if(usedIpIndex >= totalIplength){
				usedIpIndex = 0;

                if( proxyIpIndex >= proxyIpArr.length ){
                    proxyIpIndex = 0;
                }

                var targetProxyVal = proxyIpArr[proxyIpIndex];

                proxy = require('./proxy' + targetProxyVal);

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

                    eachCapture( proxyIps );

                });

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
         var mlistRes = fs.readFileSync(dirPath + 'fail.txt', 'utf8').toString();
         if( mlistRes ){
             mlistRes = mlistRes.replace(/^\s+|\s+$/g, '');
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
       if( fs.existsSync( baiduindex ) ) {
            var baideindexStr = fs.readFileSync( baiduindex ).toString();
           if( baideindexStr ){
               var baiduindexList = baideindexStr.split(/\r\n/);
               baiduindexList.forEach(function(v, i){
                   baiduindexList[i] = JSON.parse( v );
               });

               baiduindexList = unique(baiduindexList, true);

               baiduindexList.forEach(function(v, i){
                   if( i > 0) {
                       var baiduindexContent = fs.readFileSync( baiduindex );
                       baiduindexContent += JSON.stringify( v ) + '\r\n';
                       fs.writeFileSync( baiduindex, baiduindexContent);

                   } else {
                       fs.writeFileSync( baiduindex, JSON.stringify( v ));
                   }

               });

           }
       } else {
           console.log('没有找到' + baiduindex + '文件!')
       }
   }else if( excuteType ==  'merge' ) { // 合并数据
       var dataList = '', readerIndex = 0;
       dirWalker.walk(dirPath, function(filePath){
            if(/getSocial/i.test(filePath)) {
                var interfaceContent = fs.readFileSync( filePath).toString();

                if( interfaceContent ) {
                    var interfaceObj = JSON.parse( interfaceContent );
                    if( interfaceObj.data && interfaceObj.data.length ) {

                        interfaceContent = interfaceContent.replace(/[\r\n]/gm, '');
                        dataList += interfaceContent + '\r\n';
                        createFile(baiduindex, dataList);
                        readerIndex++;
                    }
                }
            }
       });



   } else { // 读取csv
           nodeCsv.each('mname.csv').on('data', function(data) {
               if( data instanceof Array && data.length ) {
                   mlist.push(urlencode(data[0], 'gbk'));
               }
           }).on('end', function() {
               var sourceLength = mlist.length;
               mlist = unique( mlist );
               len = mlist.length;
               console.log('一共有' + ( sourceLength ) + '个影片关键词，其中有' + ( sourceLength - len ) + '关键词重复，有效关键词有' + len  + '个');
               createFile('mname.txt', JSON.stringify(mlist));

               excuteExec();

           });
   }
});






