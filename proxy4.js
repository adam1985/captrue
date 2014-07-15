var cheerio = require('cheerio'),
	fs = require('fs'),
    ng = require('nodegrass');
	
	
var startIndex = 1, pageSize = 100;
var createFile = function( path, content ) {
	var isexists = fs.existsSync(path);
	if(isexists) {
		fs.unlinkSync(path);
	}
	fs.writeFileSync(path, content);
	
};

var getproxy = function( callback ) {
    console.log('start getproxy ip...');

    var totalProxyIps = [];

    (function () {
        var args = arguments;
        if (startIndex <= pageSize) {
            ng.get('http://www.xici.net.co/qq/', function (data) {

                $ = cheerio.load(data);
                var table = $('#ip_list'),
                    lineTr = table.find('tr'),
                    proxyList = [];

                lineTr.each(function (index) {
                    var ceils = $(this).find('td');
                    if( index > 0 ) {
                        proxyList.push(ceils.eq(1).text() + ':' + ceils.eq(2).text());
                    }
                });

                if (startIndex === 1) {
                    createFile('ip.txt', JSON.stringify(proxyList));

                } else {
                    var proxyIps = fs.readFileSync('ip.txt');
                    if (proxyIps) {
                        proxyIps = JSON.parse(proxyIps);
                        fs.writeFileSync('ip.txt', JSON.stringify(proxyIps.concat(proxyList)));
                    }
                }

                totalProxyIps.concat(proxyList);

                console.log('正在获取第' + startIndex + '页数据');

                startIndex++;

                args.callee();

            }, {
                "User-Agent" : "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:30.0) Gecko/20100101 Firefox/30.0"
            }).on('error', function(e) {
                args.callee();
            });
        } else {
            console.log('done!!!');
            callback && callback(totalProxyIps);
        }

    }());

};

exports.getproxy = getproxy;
