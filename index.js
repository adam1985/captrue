/**
 * 使用命令
 *  node index [proxyIndex] [startIndex] [excuteType] [taskIndex]
 *
 */

var sys = require('sys'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    urlencode = require('urlencode'),
    nodeCsv = require('node-csv'),
    os = require('os'),
    net = require('net'),
    iconv = require('iconv-lite'),
    lineReader = require('line-reader'),

    dirWalker = require('./module/dirWalker'),
    dateFormat = require('./module/dateFormat'),
    info = require('./module/info'),
    base64 =  require('./module/base64.js'),
    tools = require('./module/tools'),
    readJson = require('./module/readJson'),
    getFilmList = require('./module/getFilmList');



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

var arguments = process.argv.splice(2);

if( arguments.length < 4 ){
    throw new Error('至少需要四个参数');
}

var proxyIpArr = [1, 2, 3, 4, 5, 6, 7, 8, 9],
    proxyIpIndex = parseInt(arguments[0]);

var targetProxy = proxyIpArr[proxyIpIndex],
    startIndex = parseInt(arguments[1]),
    excuteType = arguments[2],
    taskIndex = parseInt(arguments[3]);


var dirPath = './create/',
    dataPath ,
    workPath,
    backupPath;

    if( taskIndex > 0 ){
        workPath = dirPath + taskIndex + '/';
        backupPath = workPath + 'backup/';
        dataPath = workPath + 'data/';
    } else {
        workPath = dirPath;
        backupPath =  './backup/';
        dataPath = dirPath;
    }

var failPath = dataPath + 'fail.txt',
    successPath = dataPath + 'success.txt',
    noneresPath = dataPath + 'noneres.txt',
    logerPath = dataPath + 'loger.txt',
    baiduindexFile = dataPath + 'baiduindex.txt';

var proxy = require('./proxy/proxy' + targetProxy);

var phantom,
    mlist = [],
    logerList = [],
    mnameIndex = 0,
    len = 0,
    proxyIp,
    proxyIps,
    usedIpIndex = 0,
    totalIplength = 0,
    excuteSize = 3,
    sucessNum = 0,
    failNum = 0,
    noneresNum = 0,
    failProxyIpNum = 0,
    failProxyMount = 30,
    timeout = 60 * 1000,
	timeoutLink,
    againIndex = 0,
    failMlist,
	pid,
    pathState = {},
    restartExcute = false;

if( startIndex == -1 ) {
    var prevIndex = 0;

    var prevLoger = info.getPrevLoger(logerPath);

    if( prevLoger.endIndex > 0) {
        if( prevLoger.endIndex >= prevLoger.length - 1 ){
            prevIndex = 0;
        } else {
            prevIndex = prevLoger.endIndex + 1;
        }
    }
    startIndex = prevIndex;

}

mnameIndex = startIndex;

if( excuteType == 'repair') {
    startIndex = 0;
}

mnameIndex = parseInt( startIndex );



if( mnameIndex == 0 && excuteType == 'restart'){
    restartExcute = true
}
var createFile = function( path, content ) {
    var isexists = fs.existsSync(path);
    if(isexists) {
        fs.unlinkSync(path);
    }
    fs.writeFileSync(path, content);
};

var nodeLoger = function( data ){
      var path = workPath + 'node.txt', maxLine = 5000;
    if( fs.existsSync(path) ) {
        readJson(path, function(list){

            if( list.length > maxLine ) {
                createFile( path, data.join(' ') + '\r\n');
            } else {
                fs.appendFileSync( path, data.join(' ') + '\r\n' );
            }
        });
    } else {
        createFile( path, data.join(' ') + '\r\n');
    }

};

// 重写console.log方法
console.log = (function(){
    var _log = console.log;
    return function(){
        var now = new Date(),
            args = [].slice.call(arguments, 0);
        args.push( '任务:' + taskIndex, now.format("hh:mm:ss") );
        _log.apply(console, args);

        nodeLoger( args );
    };
}());

// 测试代理ip是否连接正常
var tcpTimeout = 30 * 1000, tcpLink;

var startCapture = function(ip, success, fail){
	//tcpLink && clearTimeout(tcpLink);
    console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + ip + '"正在检测ip是否连接正常!');
    try{
        var ipArr = ip.split(":");
        var client = net.createConnection(ipArr[1], ipArr[0]);
        client.on('connect', function () {
            success();
            client.destroy();
        });
        client.on('error', function(e) {
            fail();
            client.destroy();
        });
        /*client.on('timeout', function(e) {
            fail();
            client.destroy();
        });*/
    } catch (e){
        fail();
    }
	
	/*tcpLink = setTimeout(function(){
		fail();
		client.destroy();
	}, tcpTimeout);*/


};




//备份
dateFormat.format();
var initTime = new Date();
var dateString = initTime.format("yyyyMMddhhmmss");
if( !fs.existsSync(backupPath) ){
    fs.mkdirSync(backupPath, {mode : 'r+'});
}
spawn('cp', ["-r", dataPath, backupPath + dateString] );

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

// 检测是否有历史记录
var logerState = function( path , name, cb){
    var  isHasRecode = false;

    readJson(path, function(logerList){
        logerList.forEach(function(v, i){
            if(v.name == name ) {
                isHasRecode = true;
                return false;
            }
        });
        cb && cb(isHasRecode);
    }, 'json');


};

info.createLoger( logerPath, defaultInfo, mnameIndex, true );

console.log('开始抓取数据!');


// 生成百度指数数据
var baiduIndexState = {};
var createBaiduIndex = function( data, mnameIndex, filmname ){

    var config = {
        "1" : "19岁及以下",
        "2" : "20~29岁",
        "3" : "30~39岁",
        "4" : "40~49岁",
        "5" : "50岁及以上",
        "F" : "female",
        "M" : "male",
        "str_age" : "age",
        "str_sex" : "sex"
    };

    logerState( successPath, filmname, function(isHasRecode){
        if( !baiduIndexState[filmname] && data.length >>> 0 ) {
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

            isExists = fs.existsSync(baiduindexFile);

            if( !isExists || restartExcute && !pathState[baiduindexFile] ) {
                pathState[baiduindexFile] = 1;
                createFile(baiduindexFile, result.join(''));
            } else {
                if( !isHasRecode ) {
                    fs.appendFileSync(baiduindexFile, result.join(''));
                }

            }

            baiduIndexState[filmname] = 1;
        }
    });

};

// 生成抓取日记
var longerIndex = 0;
var captureLoger = function( data, path, isSuccess){

    if(  restartExcute && !pathState[path]) {
            pathState[path] = 1;

        createFile(path, JSON.stringify(data) + '\r\n');
    } else {
        if(fs.existsSync(path)) {

            logerState( path, data.name, function( isHasRecode ){
                if( !isHasRecode ) {
                    if( excuteType == 'repair' ) {

                        data.index = failMlist[data.index].index;

                    }

                    if( excuteType == 'again' ) {
                        data.index += againIndex + 1;
                    }

                    fs.appendFileSync(path, JSON.stringify(data) + '\r\n');
                }
            });

        } else {
            createFile(path, JSON.stringify(data) + '\r\n');
        }
    }

    if( excuteType == 'repair' && /noneres|success/i.test(path) ){
        var logerStr = '';

        readJson(failPath, function(fails){
            fails.forEach(function(v, i){
                if(v.name != data.name  ) {
                    logerStr += JSON.stringify( v ) + '\r\n';
                }
            });
            fs.writeFileSync(failPath, logerStr);
        }, 'json');

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

    info.createLoger( logerPath, defaultInfo, mnameIndex );


    console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + mlist[mnameIndex] + '"日记已记录!');


    mnameIndex++;

};

var readLocalProxy = function ( data ) {
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
};



var captureState = {}, userProxyState = {};
// 递归调用数据抓取
var excuteExec = function(){
    var arg = arguments, mname = mlist[mnameIndex];

        if( captureState[mnameIndex] === undefined){
            captureState[mnameIndex] = 0;
        } else {
            captureState[mnameIndex]++;
        }

        if( userProxyState[usedIpIndex] === undefined){
            userProxyState[usedIpIndex] = 0;
        } else {
            userProxyState[usedIpIndex]++;
        }

        timeoutLink && clearTimeout(timeoutLink);

        if( pid ) {

			spawn('kill', ['-9', pid]);

            phantom.kill('SIGTERM');
            //usedIpIndex++;
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
                    commandArray.push( mnameIndex, base64.encode( urlencode( mname , 'gbk')), taskIndex  );

                    phantom = spawn('phantomjs', commandArray, {
                        timeout : timeout
                    });
					
					pid = phantom.pid;

                    timeoutLink = setTimeout(function(){
                        phantom.kill('SIGTERM');
						if( pid ) {
							spawn('kill', ['-9', pid]);
						}

                        console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+proxyIp+':phantomjs无响应，重启服务!');

                        usedIpIndex++;
						arg.callee();
                    }, timeout);

                    phantom.stdout.on('data', function (data) {
                        if( mlist[mnameIndex] ) {
                            data = data.toString();

                            var stdout = tools.trim( data );

                            var result = {};

                            try{
                                result =  JSON.parse( stdout );
                            }catch( e ){
                                console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + mlist[mnameIndex] + '"json数据解析错误，抓取失败，重新抓取');
                                if( captureState[mnameIndex] < excuteSize ) {
                                    usedIpIndex++;
                                } else {
                                    captureLoger({
                                        index : mnameIndex,
                                        name : mlist[mnameIndex],
                                        success : false
                                    }, failPath);

                                }
                                //failProxyIpNum++;
                                //arg.callee();
                            }

                            if( result.complete ) {
                                console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + mlist[mnameIndex] + '"抓取完成');
                                failProxyIpNum = 0;

                                captureLoger({
                                    index : mnameIndex,
                                    name : mlist[mnameIndex],
                                    success : true
                                }, successPath, true);

                                //arg.callee();
                            } else if( result.success ) {
                                console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + mlist[mnameIndex] + result.face + '接口"抓取成功');
								
                                var content = JSON.parse( result.content );
                                createBaiduIndex( content.data, mnameIndex, mlist[mnameIndex] );

                            } else if(result.success === false ){

                                if( result.noneres ) {
                                    console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + mlist[mnameIndex] + '"关键词未收录，没有结果!');
                                    captureLoger({
                                        index : mnameIndex,
                                        name : mlist[mnameIndex],
                                        success : false
                                    }, noneresPath);
                                    failProxyIpNum = 0;

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
                                    failProxyIpNum++;
                                }else {
                                    if( captureState[mnameIndex] < excuteSize ) {
                                        console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + mlist[mnameIndex] + '"页面超时，抓取失败，重新抓取');
                                        usedIpIndex++;
                                    } else {
                                        console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + mlist[mnameIndex] + '"页面超时，抓取失败，记录日记');
                                        captureLoger({
                                            index : mnameIndex,
                                            name : mlist[mnameIndex],
                                            success : false
                                        }, failPath );

                                    }
                                    failProxyIpNum++;
                                }
                                //arg.callee();
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
                        //arg.callee();
                    });

                    phantom.on('close', function (code,signal) {
                       phantom.kill(signal);
                       phantom.stdin.end();
                    });

                    phantom.on('error',function(code,signal){
                        phantom.kill(signal);
                    });


                    phantom.on('exit', function (code,signal) {
                        phantom.kill(signal);
                        console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+proxyIp+':进程结束，将重新启动抓取!');
                        phantom.stdin.end();
                        /*if( userProxyState[proxyIp] >= excuteSize ) {
							usedIpIndex++;
						}*/
                        arg.callee();
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

                    failProxyIpNum++;

                    arg.callee();
                });
            };

			if(usedIpIndex >= totalIplength || failProxyIpNum >= failProxyMount - 1){
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
                        readLocalProxy( data );

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

        } else {
            console.log('执行完毕');
            repairFailList();
        }
};

var repairFailList = function( ) {
    excuteType = 'repair';
    readJson(failPath, function(list){
        failMlist = list;
        if( failMlist.length ){
            failMlist.forEach( function(v){
                if( !v.success ) {
                    mlist.push(v.name);
                }
            });
            len = mlist.length;
            mnameIndex = 0;
            console.log('fail.txt文件列表中关键词一共有' + len  + '个');

            if( len > 0) {
                excuteExec();
            } else {
                console.log('所有影片数据成功抓取!');
            }
        } else {
            console.log('所有影片数据成功抓取!');
        }
    });

};

// 抓取代理ip
proxy.getproxy( function( data ){
    readLocalProxy( data );

   if( excuteType ==  'repair') { // 修复模式
       repairFailList();
   } else if(excuteType ==  'again' || excuteType == 'restart') { // 读取csv
       getFilmList(workPath, function(filmList, index){
           if( index ) {
               againIndex = index;
           }

           mlist = filmList;

           len = mlist.length;

           console.log('一共有' + ( len ) + '个影片关键词待抓取!');
           excuteExec();

       }, excuteType);

   }
});






