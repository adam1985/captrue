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
            var url;
            if( startIndex == 1 ){
                url = 'http://www.cz88.net/proxy/index.aspx'
            } else {
                url = 'http://www.cz88.net/proxy/http_' + startIndex + '.aspx';
            }
            ng.get(url, function (data) {


                $ = cheerio.load(data);
                var tbody = $('table'),
                    lines = tbody.find('tr'),
                    proxyList = [];

                lines.each(function (index) {
                    var line = $(this), ceils = line.find('td');
                    if( index > 0 ) {
                        proxyList.push(  ceils.eq(0).text() + ':' + ceils.eq(1).text());
                    }
                });

                totalProxyIps = totalProxyIps.concat(proxyList);

                console.log('正在获取第' + startIndex + '页数据');

                startIndex++;

                args.callee();

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
