var cheerio = require('cheerio'),
	fs = require('fs'),
    ng = require('nodegrass');
	
	
var startIndex = 1, pageSize = 20;
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
            ng.get('http://www.kuaidaili.com/proxylist/' + startIndex, function (data) {

                $ = cheerio.load(data);
                var table = $('table'),
                    lineTr = table.find('tbody tr'),
                    proxyList = [];

                lineTr.each(function (index) {
                    var ceils = $(this).find('td');
                        proxyList.push(ceils.eq(0).text() + ':' + ceils.eq(1).text());
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
