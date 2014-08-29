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

    var headers = {
       'Content-Type': 'application/x-www-form-urlencoded',
       'Content-Length': 10,
        "User-Agent" : "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0",
        "Host" : "www.5iggx.com",
        "Cookie" :	"CNZZDATA1000313863=1675603735-1409293815-%7C1409293815",
        "Referer" :	"http://www.5iggx.com/"
    };

    ng.post('http://www.5iggx.com/Q1002054290.php',function(data) {
        $ = cheerio.load(data);

        var content = $('body').html(),
            rex = /\d+\.\d+\.\d+\.\d+:\d+/gm,
            proxyIps = content.match(rex);
        if( proxyIps && proxyIps.length ){
            proxyList = proxyIps;
        }

        callback && callback(proxyList);

    }, headers, {tqsl:1000, ktip : '', "ports[]2" : "" , sxa : "", "sxb" : ""},'gbk').on('error', function(e) {
        callback && callback(proxyList);
    });
};


exports.getproxy = getproxy;

