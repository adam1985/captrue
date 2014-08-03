var cheerio = require('cheerio'),
	fs = require('fs'),
    ng = require('nodegrass');
	
	
var startIndex = 1, pageSize = 27;
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
                url = 'http://www.dailik.com/http_ip/101032.html'
            } else {
                url = 'http://www.dailik.com/http_ip/101032_' + startIndex + '.html';
            }
            ng.get(url, function (data) {

                $ = cheerio.load(data);
                var article_content = $('.article_content'),
                    spans = article_content.find('span'),
                    proxyList = [];

                spans.each(function (index) {
                    var str = $(this).text();
                    proxyList.push( str.substring( 0, str.indexOf('@') ) );
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
