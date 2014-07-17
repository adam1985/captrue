var cheerio = require('cheerio'),
	fs = require('fs'),
    ng = require('nodegrass');


var createFile = function( path, content ) {
	var isexists = fs.existsSync(path);
	if(isexists) {
		fs.unlinkSync(path);
	}
	fs.writeFileSync(path, content);
	
};

var urls = ['http://cn-proxy.com/', 'http://cn-proxy.com/archives/218'], index = 0;

var getproxy = function( callback ) {
    console.log('start getproxy ip...');
    var proxyList = [];

    (function(){
        var args = arguments;
        if( index < urls.length) {
            ng.get(urls[index],function(data) {
                $ = cheerio.load(data);
                var table = $('table');
                table.each(function(){
                    var $this = $(this);
                    var lineTr = $this.find('tbody').find('tr');
                    lineTr.each(function ( index ) {
                        var ceils = $(this).find('td');
                        proxyList.push(ceils.eq(0).text() + ':' + ceils.eq(1).text());
                    });
                });

                index++;
                args.callee();
            });
        } else {
            createFile('ip.txt', JSON.stringify(proxyList));
            callback && callback(proxyList);
       }

    }());

};

exports.getproxy = getproxy;

