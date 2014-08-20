var cheerio = require('cheerio'),
	fs = require('fs'),
    urlencode = require('urlencode'),
    ng = require('nodegrass');


var createFile = function( path, content ) {
	var isexists = fs.existsSync(path);
	if(isexists) {
		fs.unlinkSync(path);
	}
	fs.writeFileSync(path, content);
	
};

var areas = ['河北'];
var  Operators = ['电信,联通,移动'];


var getproxy = function( callback ) {
    console.log('start getproxy ip...');
    var proxyList = [];

    ng.get('http://mianfeidaili.ttju.cn/getAgent.php?Number=10000&Area=' + urlencode(areas[0], 'gbk') + '&Operators=' + urlencode(Operators[0], 'gbk') + '&port=%C7%EB%CC%EE%D0%B4%CB%F9%D0%E8%B5%C4%B6%CB%BF%DA&list=Blist',function(data) {
        $ = cheerio.load(data);

        var content = $('body').html(),
            rex = /\d+\.\d+\.\d+\.\d+:\d+/gm,
            proxyIps = content.match(rex);
        if( proxyIps && proxyIps.length ){
            proxyList = proxyIps;
        }

        callback && callback(proxyList);

    }).on('error', function(e) {
        callback && callback(proxyList);
    });
};

exports.getproxy = getproxy;

