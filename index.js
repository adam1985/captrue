var sys = require('sys'),
    fs = require('fs'),
    exec = require('child_process').exec,
    urlencode = require('urlencode'),
    nodeCsv = require('node-csv'),
    cheerio = require('cheerio'),
	iconv = require('iconv-lite'),
	net = require('net'),
    proxy = require('./proxy2'),
    dirWalker = require('./dirWalker');

var dirPath = './create/', mlist = [],  mnameIndex = 0, len = 0, proxyIp, proxyIps, usedIpIndex = 0, totalIplength = 0;

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

// 递归调用数据抓取
var excuteExec = function(){
    var arg = arguments, mname = mlist[mnameIndex];
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

                    exec(commandArray.join(' '), function (error, stdout, stderr) {
                        if (error !== null) {
                            console.log('error: ' + error);
                        } else {
                            console.log('"' + urlencode.decode(mlist[mnameIndex], 'gbk') + '"成功抓取=>\r\n' + stdout);
                        }
                        mnameIndex++;
                        usedIpIndex++;
                        arg.callee();
                    });
                }, function(){
                    console.log(proxyIp+':连接异常');
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

var createFile = function( path, content ) {
	var isexists = fs.existsSync(path);
	if(isexists) {
		fs.unlinkSync(path);
	}
	fs.writeFileSync(path, content);
	
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

    var arguments = process.argv.splice(2),
        excuteType = arguments[0];

   if( excuteType ==  'repair') { // 修复模式
         var mlistRes = fs.readFileSync('loger.txt');
         if( mlistRes ){
             var mlistArr = JSON.parse( mlistRes );
             if( mlistArr.length ){
                 mlistArr.forEach( function(v){
                        if( !v.success ) {
                            var nmane = v.title;
                            if( v.connect === undefined ) {
                                nmane = urlencode(v.title, 'gbk');
                            }
                            mlist.push(nmane);
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










