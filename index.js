/**
 * 使用命令
 *  node index
 *  node index repair
 *  node index merge
 *  node index 24
 *
 */

var arguments = process.argv.splice(2),
    targetProxy = arguments[0],
    excuteType = arguments[1];

    if( !targetProxy ) {
        targetProxy = 1;
    }

    if( !excuteType ) {
        excuteType = 0;
    }

    if( targetProxy == 'repair' || targetProxy == 'merge') {
        excuteType = targetProxy;
        targetProxy = 1;
    }

var sys = require('sys'),
    fs = require('fs'),
    exec = require('child_process').exec,
    urlencode = require('urlencode'),
    nodeCsv = require('node-csv'),
    cheerio = require('cheerio'),
	net = require('net'),
    proxy = require('./proxy' + targetProxy),
    dirWalker = require('./dirWalker');

var dirPath = './create/', phantom, mlist = [],  mnameIndex = 0, len = 0, proxyIp, proxyIps, usedIpIndex = 0, totalIplength = 0;

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
var longerIndex = 0;
var captureLoger = function( data, path){
    var resList = [];
    if( longerIndex == 0 && excuteType == 0  ) {
        resList.push(data);
        createFile(path, JSON.stringify(resList));
        longerIndex++;
    } else {
        resList = JSON.parse(fs.readFileSync(path));
        fs.writeFileSync(path, JSON.stringify(resList.concat( data )));
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
            var commandArray =['phantomjs'], eachCapture = function(proxyIps){
                if( proxyIps ) {
                    proxyIp = proxyIps[usedIpIndex];
                }

                startCapture(proxyIp, function(){
                    console.log(proxyIp+':连接正常');
                    if( proxyIp ){
                        commandArray.push( '--proxy=' + proxyIp );
                    }

                    commandArray.push( '--output-encoding=gbk' );

                    //commandArray.push( '--script-encoding=gbk' );

                    commandArray.push( 'capture.js' );
                    commandArray.push( mnameIndex );

                    phantom = exec(commandArray.join(' '), {
                        timeout : 60 * 1000
                    }, function (error, stdout, stderr) {
                        if (error !== null) {
                            console.log('[' + mnameIndex + ']'+proxyIp+':连接异常1');
                            usedIpIndex++;
                            arg.callee();
                        } else {
                            if( mlist[mnameIndex] ) {
                                stdout = stdout.replace(/^\s+|\s+$/g, '');

                                var result = {};

                                try{
                                    result = JSON.parse( stdout );
                                }catch( e ){
                                    console.log('[' + mnameIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"抓取失败，重新抓取');
                                    if( captureState[mnameIndex] < 3 ) {
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

                                    mnameIndex++;

                                    arg.callee();

                                } else {
                                    console.log('[' + mnameIndex + ']'+'"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"抓取失败，重新抓取');
                                    if( captureState[mnameIndex] < 3 ) {
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

                            }

                        }


                    });

                }, function(){
                    console.log('[' + mnameIndex + ']'+proxyIp+':连接异常2');
                    usedIpIndex++;
                    arg.callee();
                });
            };

			if(usedIpIndex >= totalIplength){
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

			}
            eachCapture( proxyIps );
        }
};



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

   if( excuteType ==  'repair') { // 修复模式
         var mlistRes = fs.readFileSync('loger.txt');
         if( mlistRes ){
             var mlistArr = JSON.parse( mlistRes );
             if( mlistArr.length ){
                 var totalList = fs.readFileSync('mname.txt').toString();
                 if( totalList ) {
                     totalList = JSON.parse( totalList );
                 }
                 mlistArr.forEach( function(v){
                        if( !v.success ) {
                            var nmane = totalList[v.index];
                            mlist.push(nmane);
                        }
                 });

                 len = mlist.length;

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
           if( excuteType && /\d+/.test( excuteType ) ) {
               mnameIndex = parseInt( excuteType );
           }
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






