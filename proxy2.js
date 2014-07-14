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

var getproxy = function( callback ) {
    console.log('start getproxy ip...');

    ng.get('http://cn-proxy.com/',function(data) {
        $ = cheerio.load(data);
        var table = $('table').eq(1),
            lineTr = table.find('tbody').find('tr'),
            proxyList = [];

        lineTr.each(function ( index ) {
            var ceils = $(this).find('td');
            if( index > 0 ) {
                proxyList.push(ceils.eq(0).text() + ':' + ceils.eq(1).text());
            }

        });

        createFile('ip.txt', JSON.stringify(proxyList));

        callback && callback(proxyList);

    });
};

exports.getproxy = getproxy;

