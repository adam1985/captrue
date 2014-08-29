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

    ng.get('http://liunianip.sinaapp.com/tiqv.php?sxb=&tqsl=1000&ports=&ktip=&xl=%C8%AB%B2%BF&submit=%CC%E1++%C8%A1',function(data) {
        $ = cheerio.load(data);

        var content = $('body').html(),
            rex = /\d+\.\d+\.\d+\.\d+:\d+/gm,
            proxyIps = content.match(rex);
        if( proxyIps && proxyIps.length ){
            proxyList = proxyIps;
        }

        callback && callback(proxyList);

    }).on('error', function(e) {
        callback && callback(proxyList);
    });
};


exports.getproxy = getproxy;

