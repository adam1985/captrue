/**
 * 使用命令
 *  node index [startIndex] [excuteType] [taskIndex]
 *
 */

var sys = require('sys'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    fork = require('child_process').fork,
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

if( arguments.length < 3 ){
    throw new Error('至少需要三个参数');
}



var startIndex = parseInt(arguments[0]),
    excuteType = arguments[1],
    taskIndex = parseInt(arguments[2]);


var dirPath = './create/',
    proxyPath = __dirname + '/ip/',
    formalPath =  proxyPath + 'formal.txt',
    successProxyPath = proxyPath + 'success.txt',
    failProxyPath = proxyPath + 'fail.txt',
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


var phantom,
    baiduindexContents = [],
    mlist = [],
    logerList = [],
    mnameIndex = 0,
    mname,
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
    failProxyMount = 10,
    timeout = 60 * 1000,
	timeoutLink,
    againIndex = 0,
    failMlist,
	pid,
    nodePid = process.pid,
    nodeTimeout = 2 * 60 * 1000,
    nodeTimeoutLink,
    pathState = {},
    restartExcute = false;

if( startIndex == -1 ) {
    var prevIndex = 0;

    var prevLoger = info.getPrevLoger(logerPath);

    if( prevLoger.endIndex > 0 ) {
        if( prevLoger.endIndex >= prevLoger.length ){
            prevIndex = 0;
            excuteType = 'repair';
        } else {
            prevIndex = prevLoger.endIndex;
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

//备份
dateFormat.format();
var initTime = new Date();
var dateString = initTime.format("yyyyMMddhhmmss");
/*if( !fs.existsSync(backupPath) ){
    fs.mkdirSync(backupPath);
}
spawn('cp', ["-r", dataPath, backupPath + dateString] );

console.log('成功备份数据');*/

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
var createBaiduIndex = function( interfaceContents, mnameIndex, filmname ){

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
            var getSocial = [], interest = [], filmType = mlist[mnameIndex].type;

            interfaceContents.forEach( function(value, key){
                if( /getSocial/i.test(value.face) ) {
                    value.data.forEach(function(v){
                        var mname = v.word;
                        if( typeof v == 'object' ) {
                            tools.each(v, function(key1, val1){
                                if( typeof val1 == 'object' ){
                                    tools.each( val1, function(key2, val2){
                                        getSocial.push( [filmType, mname, config[key1], config[key2], val2, val2].join('\t') + '\r\n');
                                    });
                                }
                            });
                        }
                    });
                } else if( /interest/i.test(value.face) ) {
                    tools.each(value.data, function(key, value){
                        var mname = key;
                        tools.each(value, function(i, val){
                            var interestVal = val.split(',');
                            interest.push( [filmType, mname, "兴趣分布", interestVal.shift(), interestVal.join(','), interestVal.join(',')].join('\t') + '\r\n');
                        });
                    });
                }
            });

            var result = [].concat(getSocial, interest);

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
var captureLoger = function( data, path, isSuccess, cb){
    var mname = data.name, mindex = data.index;

    if( mindex < len ) {
        data.index = mlist[mindex].index;
        data.type = mlist[mindex].type;

        if(  restartExcute && !pathState[path]) {
            pathState[path] = 1;

            createFile(path, JSON.stringify(data) + '\r\n');
        } else {
            if(fs.existsSync(path)) {

                logerState( path, mname, function( isHasRecode ){
                    if( !isHasRecode ) {
                        if( excuteType == 'repair' ) {

                            data.index = failMlist[mindex].index;

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
                    if(v.name != mname  ) {
                        logerStr += JSON.stringify( v ) + '\r\n';
                    }
                });
                if( logerStr ) {
                    fs.writeFileSync(failPath, logerStr);
                } else {
                    fs.unlinkSync(failPath);
                }

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

        defaultInfo.endIndex = mnameIndex + 1;
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

        if( excuteType != 'repair' ) {
            info.createLoger( logerPath, defaultInfo, mnameIndex );
        }

        console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + mname + '"日记已记录!');


        cb && cb();
        mnameIndex++;
    }

};


var getProxyIp = function( index ){
    if( index >= totalIplength ) {
        usedIpIndex = 0;
    }
    proxyIp = proxyIps[usedIpIndex].name;
};

var appendFile = function( path, content ){
    var isexists = fs.existsSync(path);
    if(isexists) {
        fs.appendFileSync(path, content);
    } else {
        fs.writeFileSync(path, content);
    }
};

// 生成代理记录
var createProxyLoger = function(path, name, type){
    readJson(path, function(list){
        if( !tools.inArray(list, name, true) ) {
            appendFile(path, JSON.stringify({name : name, type : type}) + '\r\n');
        }
    }, 'json');
};


// 测试代理ip是否连接正常
var tcpTimeout = 30 * 1000, tcpLink;
var startCapture = function(ip, success, fail){
    var arg = arguments;
    console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + ip + '"正在检测ip是否连接正常!');
    var checkProxy = function(){
        try{
            var ipArr = ip.split(":");
            var client = net.createConnection(ipArr[1], ipArr[0]);
            client.on('connect', function () {
                success();
            });
            client.on('error', function(e){
                console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + ip + '"网络连接异常!');
                createProxyLoger(failProxyPath, ip, 'fail');
                getProxyIp( ++usedIpIndex );
                arg.callee( proxyIp, success);
            });
            client.on('timeout', function(e) {
                console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + ip + '"网络tcp连接超时!');
                createProxyLoger(failProxyPath, ip, 'fail');
                getProxyIp( ++usedIpIndex );
                arg.callee( proxyIp, success);
            });
        } catch (e){
            console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + '"' + ip + '"ip或端口格式不对!!');
            createProxyLoger(failProxyPath, ip, 'fail');
            getProxyIp( ++usedIpIndex );
            arg.callee( proxyIp, success);
        }
    };

    checkProxy();


/*    tcpLink = setTimeout(function(){
         tcpLink && clearTimeout(tcpLink);
     }, tcpTimeout);*/


};

var stdoutLoger = function( path, msg, successState, success, cb ){
    cb = cb || function(){};
    console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+proxyIp+':' + msg);
    if( successState ) {
        captureLoger({
            index : mnameIndex,
            name : mname,
            success : success
        }, path, success, cb );
    } else {
        if( captureState[mnameIndex] < excuteSize ){
            usedIpIndex++;
        } else {
            captureLoger({
                index : mnameIndex,
                name : mname,
                success : success
            }, path);
        }
    }


    //phantom.stdin.end();

};

var captureState = {}, userProxyState = {}, phantomStete = {};
// 递归调用数据抓取
var excuteExec = function(){
    var arg = arguments;
    baiduindexContent = [];

    timeoutLink && clearTimeout(timeoutLink);
    nodeTimeoutLink && clearTimeout(nodeTimeoutLink);

        if(mnameIndex < len){

            if( mlist[mnameIndex] ) {

                mname  = mlist[mnameIndex].name;

                var commandArray =[], eachCapture = function(proxyIps){
                    if( proxyIps ) {
                        proxyIp = proxyIps[usedIpIndex].name;
                    }

                    startCapture(proxyIp, function(){
                        console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + proxyIp + ':连接正常');

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

                        if( phantom ) {
                            phantom.kill();
                        }

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
                            timeoutLink && clearTimeout(timeoutLink);

                            phantom.kill();

                            console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+proxyIp+':phantomjs无响应，重启服务!');

                            usedIpIndex++;
                            if( !phantomStete[mnameIndex + '_' + usedIpIndex] ) {
                                phantomStete[mnameIndex + '_' + usedIpIndex] = 1;
                                arg.callee();
                            }

                        }, timeout);

                        nodeTimeoutLink = setTimeout(function(){
                            nodeTimeoutLink && clearTimeout(nodeTimeoutLink);
                            usedIpIndex++;
                            console.log('[' + mnameIndex + '-' + usedIpIndex + ']' + proxyIp + 'phantomjs超时将重新!');
                            phantom.kill();
                            process.kill(nodePid);
                            //arg.callee();
                        }, nodeTimeout);

                        phantom.stdout.on('data', function (data) {
                            data = data.toString();

                            var stdout = tools.trim( data );

                            var result;

                            if( /{.*}/i.test(stdout)  && /index/i.test(stdout)  && /success/i.test(stdout) && /msg/i.test(stdout)) {

                                //console.log(stdout);

                                var resultStr = stdout.match(/{(.*?)}/)[0];

                                console.log(resultStr);

                                try{
                                    result =  JSON.parse( resultStr );
                                }catch( e ){

                                }

                                if( result ) {

                                    if( result.success ) {
                                        var interfaceList = result.face || [];
                                        interfaceList.forEach(function(v){
                                            console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+'"' + mname + v + '接口"抓取成功');
                                        });

                                        baiduindexContents = result.content;

                                        stdoutLoger(successPath, '抓取完成', true, true, function(){
                                            var interfaceContents = [];
                                            baiduindexContents.forEach(function(value){
                                                interfaceContents.push( JSON.parse(tools.trim(base64.decode(value))));
                                            });
                                            createBaiduIndex(interfaceContents, mnameIndex, mname );
                                            createProxyLoger(successProxyPath, proxyIp, 'success');
                                        });

                                    } else if( result.success === false ){

                                        if( result.noneres ) {

                                            stdoutLoger(noneresPath, '关键词未收录，没有结果!', true);

                                        } else if( result.block ) {

                                            stdoutLoger(failPath, '代理ip被百度屏蔽!', false);
                                        }else {
                                            stdoutLoger(failPath, '页面超时，抓取失败，重新抓取', false);
                                        }
                                        //arg.callee();
                                    } else {
                                        //stdoutLoger(failPath, 'phantomjs未知错误!', false);
                                    }
                                } else {
                                    stdoutLoger(failPath, 'json数据解析错误，抓取失败，重新抓取', false);
                                }


                            } else {

                                //stdoutLoger(failPath, 'phantomjs处理异常!', false);
                            }
                        });

                        phantom.stderr.on('data', function (data) {
                            stdoutLoger(failPath, '错误输出流!', false);
                        });

                        phantom.on('close', function (code,signal) {
                            //phantom.kill(signal);
                            //phantom.stdin.end();
                        });

                        phantom.on('error',function(code,signal){
                            //phantom.kill(signal);
                        });

                        phantom.on('exit', function (code,signal) {
                            //phantom.kill(signal);
                            console.log('[' + mnameIndex + '-' + usedIpIndex + ']'+proxyIp+':进程结束，将重新启动抓取!');
                            if( !phantomStete[mnameIndex + '_' + usedIpIndex] ) {
                                phantomStete[mnameIndex + '_' + usedIpIndex] = 1;
                                arg.callee();
                            }

                        });

                    });
                };

                if(usedIpIndex >= totalIplength){
                    usedIpIndex = 0;
                }
                eachCapture( proxyIps );
            }

        } else {
            console.log('执行完毕');
            repairFailList();
        }
};


var repairFailList = function() {
    excuteType = 'repair';
    phantomStete = {};
    mlist = [];
    readJson(failPath, function(list){
        failMlist = list;
        if( failMlist.length ){
            failMlist.forEach( function(v){
                if( !v.success ) {
                    mlist.push(v);
                }
            });
            len = mlist.length;
            mnameIndex = 0;
            console.log('fail.txt文件列表中关键词一共有' + len  + '个');

            if( len > 0) {
                excuteExec();
            } else {
                process.send({complete : true});
                console.log("所有影片数据成功抓取!");
                //process.kill(nodePid);
            }
        } else {

            process.send({ complete : true});
            console.log("所有影片数据成功抓取!");
            //process.kill(nodePid);
        }
    }, 'json');

};


// 抓取代理ip
readJson(formalPath, function(proxyList){
    proxyIps = proxyList || [];
    totalIplength = proxyIps.length;
    usedIpIndex = Math.floor(Math.random() * totalIplength);

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
}, 'json');







