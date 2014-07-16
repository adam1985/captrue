/**
 * 使用命令
 *  node index [proxy] [startIndex] [excuteType]
 */

/**
 * 处理参数
 * @type {Array}
 */

var arguments = process.argv.splice(2),
    targetProxy = arguments[0] || 1,
    startIndex = arguments[1] || 0,
    excuteType = arguments[2];

    if( targetProxy == 'repair' || targetProxy == 'merge') {
        excuteType = targetProxy;
        targetProxy = 1;
    }

    if( startIndex == 'repair' || startIndex == 'merge') {
        excuteType = startIndex;
        startIndex = 0;
    }


var sys = require('sys'),
    fs = require('fs'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    urlencode = require('urlencode'),
    nodeCsv = require('node-csv'),
    cheerio = require('cheerio'),
	net = require('net'),
    proxy = require('./proxy' + targetProxy),
    dirWalker = require('./dirWalker'),
    dateFormat = require('./dateFormat');

var dirPath = './create/',
    backupPath = './backup/',
    phantom,
    mlist = [],
    logerList = [],
    mnameIndex = 0,
    len = 0,
    proxyIp,
    proxyIps,
    usedIpIndex = 0,
    totalIplength = 0,
    excuteSize = 3;

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

// 生成抓取日记
var longerIndex = 0, pathState = {};
var captureLoger = function( data, path, type){
    var resList = [];
    if( type == 'repair' ) {
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
                        //commandArray.push( '--proxy-type=none' );
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
                                console.log('[' + mnameIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"抓取失败，重新抓取');
                                if( captureState[mnameIndex] < excuteSize ) {
                                    usedIpIndex++;
                                } else {
                                    captureLoger({
                                        index : mnameIndex,
                                        name : urlencode.decode(mlist[mnameIndex], 'gbk'),
                                        success : false
                                    }, dirPath + 'loger.txt');
                                    mnameIndex++;
                                }
                                arg.callee();
                            }

                            if( result.success ) {
                                console.log('[' + mnameIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"抓取成功');

                                if( excuteType == 'repair') {
                                    captureLoger({
                                        index : mnameIndex
                                    }, dirPath + 'loger.txt', 'repair');
                                }


                                mnameIndex++;

                                arg.callee();

                            } else {

                                if( result.noneres ) {
                                    console.log('[' + mnameIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"关键词未收录，没有结果!');
                                    captureLoger({
                                        index : mnameIndex,
                                        name : urlencode.decode(mlist[mnameIndex], 'gbk'),
                                        success : false
                                    }, dirPath + 'noneres.txt');
                                    mnameIndex++;
                                } if( result.block ) {
                                    console.log('[' + mnameIndex + ']'+proxyIp+':代理ip被百度屏蔽!');
                                    usedIpIndex++;
                                }else {
                                    if( captureState[mnameIndex] < excuteSize ) {
                                        console.log('[' + mnameIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"抓取失败，重新抓取');
                                        usedIpIndex++;
                                    } else {
                                        console.log('[' + mnameIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"抓取失败，记录日记');
                                        captureLoger({
                                            index : mnameIndex,
                                            name : urlencode.decode(mlist[mnameIndex], 'gbk'),
                                            success : false
                                        }, dirPath + 'loger.txt' );
                                        mnameIndex++;
                                    }
                                }
                                arg.callee();
                            }

                        }
                    });

                    phantom.stderr.on('data', function (data) {
                        console.log('[' + mnameIndex + ']'+proxyIp+':网络连接超时!');
                        usedIpIndex++;
                        arg.callee();
                    });

                    phantom.on('close', function (code) {
                        phantom.stdin.end();
                    });

                }, function(){
                    console.log('[' + mnameIndex + ']'+proxyIp+':网络连接异常');
                    if( captureState[mnameIndex] < excuteSize ){
                        usedIpIndex++;
                    } else {
                        mnameIndex++;
                    }

                    arg.callee();
                });
            };

			if(usedIpIndex >= totalIplength - 1){
				usedIpIndex = 0;
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

//备份

dateFormat.format();
var now = new Date();
var dateString = now.format("yyyyMMddhhmmss");
spawn('cp', ["-r", dirPath, backupPath + dateString] );
console.log('成功备份数据');

console.log('start capture!!!');

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
         mnameIndex = parseInt( startIndex );
         var mlistRes = fs.readFileSync(dirPath + 'loger.txt', 'utf8').toString();
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
   } else if( excuteType ==  'merge' ) { // 合并数据
       var dataList = '', readerIndex = 0;
       dirWalker.walk(dirPath, function(filePath){
            if(/getSocial/i.test(filePath)) {
                var interfaceContent = fs.readFileSync( filePath).toString();

                if( interfaceContent ) {
                    var interfaceObj = JSON.parse( interfaceContent );
                    if( interfaceObj.data && interfaceObj.data.length ) {

                        interfaceContent = interfaceContent.replace(/[\r\n]/gm, '');
                        dataList += interfaceContent + '\r\n';
                        createFile(dirPath + 'baiduindex.json', dataList);
                        readerIndex++;
                    }
                }
            }
       });



   } else { // 读取csv
           mnameIndex = parseInt( startIndex );
           nodeCsv.each('mname.csv').on('data', function(data) {
               if( data instanceof Array && data.length ) {
                   mlist.push(urlencode(data[0], 'gbk'));
               }
           }).on('end', function() {
               len = mlist.length;
               createFile('mname.txt', JSON.stringify(mlist));

               excuteExec();

           });
   }
});






