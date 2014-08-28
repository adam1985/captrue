var cheerio = require('cheerio'),
	fs = require('fs'),
    ng = require('nodegrass'),
    tools = require('../module/tools');
	
	
var startIndex = 1, pageSize = 17;
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
            ng.get('http://www.proxycn.cn/html_proxy/http-' + startIndex + '.html', function (data) {

                $ = cheerio.load(data);
                var table = $('table[class="ctable"]'),
                    lineTr = $('tr[bgcolor="#fbfbfb"]'),
                    proxyList = [];

                lineTr.each(function (index) {
                    var ceils = $(this).find('td');

                    var ipText = ceils.eq(1).text();

                    var ip = ipText.match(/\d{1,3}\.?/gim);
                    if( ip ) {
                        proxyList.push(tools.trim(ip.join('')) + ':' + tools.trim(ceils.eq(2).text()));
                    }

                });

                totalProxyIps =  totalProxyIps.concat(proxyList);

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
