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

    ng.get('http://pachong.org/area/short/name/cn.html',function(data) {
        $ = cheerio.load(data);
        var table = $('table[class="tb"]'),
            lineTr = table.find('tbody').find('tr'),
            proxyList = [];

        lineTr.each(function ( index ) {
            var ceils = $(this).find('td');
                proxyList.push(ceils.eq(1).text() + ':' + ceils.eq(2).text());

        });

        createFile('ip.txt', JSON.stringify(proxyList));

        callback && callback(proxyList);

    });
};

exports.getproxy = getproxy;

