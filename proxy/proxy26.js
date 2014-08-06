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


var getproxy = function( callback ) {
    console.log('start getproxy ip...');
    var proxyList = [];

    ng.get('http://www.cn379.cn/mo.php?sxb=&tqsl=200&ports%5B%5D2=&ktip=&sxa=',function(data) {

        //$ = cheerio.load(data);

        var
            rex = /\d+\.\d+\.\d+\.\d+:\d+/gm,
            proxyIps = data.match(rex);
        if( proxyIps && proxyIps.length ){
            proxyList = proxyIps;
        }


        createFile('ip.txt', JSON.stringify(proxyList));

        callback && callback(proxyList);

    }).on('error', function(e) {
        callback && callback(proxyList);
    });
};

exports.getproxy = getproxy;

