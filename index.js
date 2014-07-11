var sys = require('sys'),
    fs = require('fs'),
    exec = require('child_process').exec,
    urlencode = require('urlencode'),
    nodeCsv = require('node-csv'),
    cheerio = require('cheerio'),
    ng = require('nodegrass');

var mlist = [],  mnameIndex = 0, len = 0, proxyIp, proxys;

var excuteExec = function(){
    var arg = arguments, mname = mlist[mnameIndex];
        if(mnameIndex < 2 && mname){
            var commandArray =['phantomjs'];
            if( proxys ) {
                proxyIp = proxys[mnameIndex % proxys.length];
            }

            if( proxyIp ){
                commandArray.push( '--proxy=' + proxyIp );
            }

            commandArray.push( '--output-encoding=utf8' );

            commandArray.push( 'capture.js' );
            commandArray.push( mname );

            exec(commandArray.join(' '), function (error, stdout, stderr) {
                sys.print(stdout);
                if (error !== null) {
                    console.log('error: ' + error);
                }
                mnameIndex++;
                arg.callee();
            });
        }
};

ng.get('http://cn-proxy.com/',function(data){
    $ = cheerio.load(data);
    var table = $('table').eq(1),
        lineTr = table.find('tbody').find('tr'),
        proxyList = [];

    lineTr.each(function(){
        var ceils = $(this).find('td');
        proxyList.push(ceils.eq(0).text() + ':' + ceils.eq(1).text());
    });

    fs.writeFileSync('proxy.txt', JSON.stringify(proxyList));

    nodeCsv.each('mname.csv').on('data', function(data) {
        if( data instanceof Array && data.length ) {
            mlist.push(urlencode(data[0], 'gbk'));
        }
    }).on('end', function() {
        len = mlist.length;

        proxys = proxyList;

        excuteExec();

    });

});




