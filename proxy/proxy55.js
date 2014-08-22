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
    (function(){
        var outArgs = arguments;
        if( startIndex <= pageSize ) {
            ng.get('http://www.itmop.com/proxy/catalog.asp?page=' + startIndex, function (data) {
                $ = cheerio.load(data);
                var titles = $('#NEW_INFO_LIST dt a'), pageUrls = [];
                titles.each(function(){
                    pageUrls.push($(this).attr('href'));
                });

                var innerIndex = 0;

                (function(){
                    var innerArgs = arguments;
                    if( innerIndex < pageUrls.length ) {
                        var targetUrl = pageUrls[innerIndex];
                        var innerStartIndex = 1, innerpageSize = 1;
                        (function () {
                            var args = arguments;
                            if (innerStartIndex <= innerpageSize) {
                                var url;
                                if( innerStartIndex == 1 ){
                                    url = targetUrl
                                }
                                ng.get(url, function (data) {

                                    $ = cheerio.load(data);
                                    var article_content = $('.NEW_CONTENT > p').html(),
                                        rex = /\d+\.\d+\.\d+\.\d+\s+\d+/gm,
                                        proxyList = [];

                                    try{
                                        proxyList = article_content.match(rex)
                                    } catch (e){

                                    }



                                    if( proxyList ) {
                                        proxyList.forEach(function(v){
                                            if( rex.test(v)){
                                                totalProxyIps.push(v.replace(/\s+/, ":"));
                                            }
                                        });
                                    }



                                    console.log('正在获取第' + startIndex + '-' + innerIndex + '-' + innerStartIndex + '页数据');

                                    innerStartIndex++;

                                    args.callee();

                                }).on('error', function(e) {
                                    innerStartIndex++;
                                    args.callee();
                                });
                            } else {
                                innerIndex++;
                                innerArgs.callee();
                            }

                        }());
                    } else {
                        startIndex++;
                        outArgs.callee();
                    }
                }());

            }).on('error', function(e) {
                startIndex++;
                outArgs.callee();
            });
        } else {
            console.log('done!!!');
            callback && callback(totalProxyIps);
        }

    }());

};


exports.getproxy = getproxy;
