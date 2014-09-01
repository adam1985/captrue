var cheerio = require('cheerio'),
    fs = require('fs'),
    ng = require('nodegrass');


var startIndex = 61, pageSize = 80;

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

    ng.get('http://www.mesk.cn/ip/china/', function (data) {
        $ = cheerio.load(data);
        var titles = $('.arclist-li li a.name'), pageUrls = [];
        titles.each(function(){
            pageUrls.push($(this).attr('href'));
        });

        var innerIndex = 0;

        (function(){
            var innerArgs = arguments;
            if( innerIndex < pageUrls.length ) {
                console.log('正在获取第' + innerIndex + '页数据');
                var targetUrl = 'http://www.mesk.cn' + pageUrls[innerIndex];
                ng.get(targetUrl, function (data) {
                    $ = cheerio.load(data);

                    var content = $('.article').html(),
                        rex = /\d+\.\d+\.\d+\.\d+:\d+/gm,
                        proxyIps = content.match(rex);
                    if( proxyIps && proxyIps.length ){
                        totalProxyIps = totalProxyIps.concat(proxyIps);
                    }

                    innerIndex++;
                    innerArgs.callee();

                }).on('error', function(e) {
                    innerIndex++;
                    innerArgs.callee();
                });

            } else {
                callback && callback(totalProxyIps);
            }
        }());

    }).on('error', function(e) {
        callback && callback(totalProxyIps);
    });

};


exports.getproxy = getproxy;
