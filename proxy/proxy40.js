var cheerio = require('cheerio'),
	fs = require('fs'),
    ng = require('nodegrass');
	
	
var startIndex = 1, pageSize = 2;
var createFile = function( path, content ) {
	var isexists = fs.existsSync(path);
	if(isexists) {
		fs.unlinkSync(path);
	}
	fs.writeFileSync(path, content);
	
};



var getproxy = function( callback ) {
    console.log('start getproxy ip...');

    ng.get('http://www.56ads.com/proxyip/', function (data) {
        $ = cheerio.load(data);
        var titles = $('ul .title'), pageUrls = [];
        titles.each(function(){
            pageUrls.push($(this).attr('href'));
        });

        var targetUrl = pageUrls[13];

        var totalProxyIps = [];

        (function () {
            var args = arguments;
            if (startIndex <= pageSize) {
                var url;
                if( startIndex == 1 ){
                    url = targetUrl
                } else {
                    url = targetUrl.replace(/\.html/, '_' + startIndex + '.html');
                }
                ng.get(url, function (data) {

                    $ = cheerio.load(data);
                    var article_content = $('.content').html(),
                        rex = /\d+\.\d+\.\d+\.\d+:\d+/gm,
                        proxyList = [];

                    try{
                        proxyList = article_content.match(rex)
                    } catch (e){

                    }

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

    });

};

exports.getproxy = getproxy;
