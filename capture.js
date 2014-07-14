var time =  +new Date,
    dirPath = './create/',
    fileName,
    resultFile,
    screenShot;

var url = 'http://index.baidu.com/?tpl=crowd&type=0&area=&time=14&word=';

// 百度指数必需的核心cookie，登陆百度帐号后获取
phantom.addCookie({
    'name'  : 'BDUSS',
    'value' : 'kwbElxRlYtQUR4OGhJRHJXOFRVaGNwQX5QVzRhc1RMTDdFYVZiYW14VnpodVZUQVFBQUFBJCQAAAAAAAAAAAEAAAAPqGVNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHP5vVNz-b1Tdm',
    'domain': '.baidu.com',
    'path'  : '/'
});

var page = require('webpage').create();
var fs = require('fs');
var spawn = require("child_process").spawn;
var sys =  require('system');

// 生成抓取日记
var captureLoger = function( data, path){
    var resList = [];
    if( data.index == 0 ) {
        resList.push(data);
        fs.write(path, JSON.stringify(resList), {
            mode: 'w'
        });
    } else {
        resList = JSON.parse(fs.read(path));
        fs.write(path, JSON.stringify(resList.concat( data )), {
            mode: 'w'
        });
    }
};

//抓取接口文件
var captrueInterface = function( config ) {
    var interfacePath = 'http://index.baidu.com/Interface/',
        jqueryPath = 'http://cdn.staticfile.org/jquery/2.0.3/jquery.min.js';

    page.includeJs(jqueryPath, function(){

        var postParamStr = page.evaluate(function() {
            var paramConf = {
                res : PPval.ppt,
                res2 : PPval.res2
            };
            return $.param( paramConf );
        });

        var index = 0, len = config.interfaces.length;

        (function(){
            if( index < len ) {
                var args = arguments,
                    targetObj = config.interfaces[index],
                    key = Object.keys(targetObj)[0],
                    val = targetObj[key],
                    postUrl = interfacePath + val + '?' + postParamStr;

                page.open(postUrl, function (status) {

                    if( status === 'success') {

                        console.log(JSON.stringify({index : config.index, msg : key + '.json interface suceess capture!'}));

                        var content = page.evaluate(function () {
                            return document.body.innerHTML;
                        });

                        var contentJson = JSON.parse( content );

                        if( contentJson.data && contentJson.data.length ) {
                            fs.write(dirPath + config.title + '/' + key + '.json', content, {
                                mode: 'w'
                            });

                            if( index === len - 1 ) {
                                captureLoger({
                                    index : config.index,
                                    title : config.title,
                                    success : true
                                }, 'loger.txt');

                                phantom.exit();
                            }

                            index++;

                            args.callee();

                        } else {
                            captureLoger({
                                index : config.index,
                                title : config.title,
                                success : false
                            }, 'loger.txt');

                            phantom.exit();
                        }

                    } else {

                        captureLoger({
                            index : config.index,
                            title : config.title,
                            success : false
                        }, 'loger.txt');

                        phantom.exit();

                        /*if( index === len - 1 ) {
                            phantom.exit();
                        }*/

                        //index++;

                        //args.callee();
                    }
                });

            }

        }());



    });
};

var mlist = JSON.parse(fs.read('mname.txt')), filmIndex = sys.args[1];

// 入口文件，开始抓取工作
page.open(url + mlist[filmIndex], function(status) {

    if( status === 'success') {
        var keyword = page.evaluate(function () {
            return document.getElementById('schword').value;
        });

        child = spawn('mkdir', [dirPath + keyword]);

        screenShot  = dirPath + keyword + '/baiduindex.png';     // 结果页截屏路径

        // 结果页截屏
        //page.render(screenShot);

        // 生成接口文件
        captrueInterface({
            title : keyword,
			index : filmIndex,
            interfaces : [
                /*{
                    "getRegion" : "Region/getRegion/"
                },
                {
                    "getInterest" : "Interest/getInterest/"
                },*/
                {
                    "getSocial" : "Social/getSocial/"
                }
            ]
        });
    } else {
        console.log(JSON.stringify({index : filmIndex, msg : 'interface capture fail!'}));
        captureLoger({
            index : filmIndex,
            connect : false,
            success : false
        }, 'loger.txt');

        phantom.exit();
    }

});

setTimeout(function(){
    captureLoger({
        index : filmIndex,
        connect : false,
        success : false
    }, 'loger.txt');
    phantom.exit();
}, 60 * 1000);






