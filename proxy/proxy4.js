var cheerio = require('cheerio'),
	fs = require('fs'),
    ng = require('nodegrass');
	
	
var startIndex = 1, pageSize = 10;
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
            ng.get('http://www.xici.net.co/nn/' + startIndex, function (data) {

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

                totalProxyIps = totalProxyIps.concat(proxyList);

                console.log('正在获取第' + startIndex + '页数据');

                startIndex++;

                args.callee();

            }, {
                "User-Agent" : "chrome"
            }).on('error', function(e) {
                startIndex++;
                args.callee();
            });
        } else {
            console.log('done!!!');
            callback && callback(totalProxyIps);
        }

    }());

};

exports.getproxy = getproxy;
