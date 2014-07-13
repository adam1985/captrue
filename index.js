var sys = require('sys'),
    fs = require('fs'),
    exec = require('child_process').exec,
    urlencode = require('urlencode'),
    nodeCsv = require('node-csv'),
    cheerio = require('cheerio'),
    ng = require('nodegrass'),
	iconv = require('iconv-lite'),
	net = require('net');

var mlist = [],  mnameIndex = 0, len = 0, proxyIp, proxyIps, usedIpIndex = 0, totalIplength = 0;

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



var excuteExec = function(){
    var arg = arguments, mname = mlist[mnameIndex];
        if(mnameIndex < len && mname){
            var commandArray =['phantomjs'];
			if(usedIpIndex >= totalIplength){
				usedIpIndex = 0;
			}
            if( proxyIps ) {
                proxyIp = proxyIps[usedIpIndex];
            }
			
			console.log(proxyIp);
			
			startCapture(proxyIp, function(){
				console.log(11);
				if( proxyIp ){
					commandArray.push( '--proxy=' + proxyIp );
				}
				

				commandArray.push( '--output-encoding=gbk' );
				
				//commandArray.push( '--script-encoding=gbk' );
				

				commandArray.push( 'capture.js' );
				commandArray.push( mnameIndex );
				
				console.log(commandArray.join(' '));
				
				exec(commandArray.join(' '), function (error, stdout, stderr) {
					console.log(stdout);
					if (error !== null) {
						console.log('error: ' + error);
					}
					mnameIndex++;
					usedIpIndex++;
					arg.callee();
				});
			}, function(){
				console.log(2);
				usedIpIndex++;
				arg.callee();
			});

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


var proxyIpStr = fs.readFileSync('ip.txt');
if(proxyIpStr){
	proxyIps = JSON.parse(proxyIpStr);
}

totalIplength = proxyIps.length;



nodeCsv.each('mname.csv').on('data', function(data) {
	if( data instanceof Array && data.length ) {
		mlist.push(urlencode(data[0], 'gbk'));
	}
	
}).on('end', function() {
	len = mlist.length;
	createFile('mname.txt', JSON.stringify(mlist));
	
	excuteExec();

});






