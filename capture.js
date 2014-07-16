var time =  +new Date,
    dirPath = './create/',
    filePath = dirPath + 'baiduindex.json',
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

function encode16(str){
    var ret='';
    for( var i=0,len = str.length; i < len; i++ ){
        ret += '\\u' + str.charCodeAt(i).toString(16);
    }
    return ret;
}

function decode16(str){
    var ret = '';
    for(var i=0, len = str.length; i < len; i++ ){
        ret +=str.charAt(i);
    }
    return ret;
}

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

                        var content = page.evaluate(function () {
                            return document.body.innerHTML;
                        });

                        var contentJson = {};

                        try{
                            contentJson = JSON.parse( content );
                        } catch ( e ) {
                            console.log(JSON.stringify({index : filmIndex,success : false, msg : 'interface capture fail!'}));

                            page.close();
                            phantom.exit();
                        }

                        if( contentJson.data && contentJson.data.length ) {

                            if( config.index ==0) {
                                fs.write(filePath, content, {
                                    mode: 'w'
                                });
                            } else {
                                var filmlistContent = fs.read(filePath);
                                fs.write(filePath, filmlistContent + '\r\n' +  content, {
                                    mode: 'w'
                                });
                            }

                            if( index === len - 1 ) {

                                var filmName = contentJson.data[0].word || '';


                                console.log(JSON.stringify({index : filmIndex, success : true,msg : key + '.json interface suceess capture!'}));

                                page.close();
                                phantom.exit();
                            }

                            index++;

                            args.callee();

                        } else {

                            console.log(JSON.stringify({index : filmIndex, success : false,msg : 'interface capture fail!'}));

                            page.close();
                            phantom.exit();
                        }

                    } else {

                        console.log(JSON.stringify({index : filmIndex, success : false, msg : 'interface capture fail!'}));

                        page.close();
                        phantom.exit();

                    }
                });

            }

        }());



    });
};

var mlist = JSON.parse(fs.read('mname.txt')),
    filmIndex = sys.args[1];

// 入口文件，开始抓取工作
page.open(url + mlist[filmIndex], function(status) {

    if( status === 'success') {

        var isResult = page.evaluate(function () {
            var worlds = ['立即购买', '未被收录'],
                _isResult = true,
                content = document.body.innerHTML,
                length = document.querySelectorAll('#mainWrap').length;
            worlds.forEach(function(v){
                if( content.indexOf(v) != -1 ) {
                    _isResult = false;
                }
            });

            return  _isResult && length > 0;
        });

        //console.log( isResult );

        if( isResult ) {
            // 生成接口文件
            captrueInterface({

                index : filmIndex,
                interfaces : [
                    {
                        "getSocial" : "Social/getSocial/"
                    }
                ]
            });
        } else {
            console.log(JSON.stringify({index : filmIndex, noneres : true, success : false,msg : 'keyword none result!!!'}));

            page.close();
            phantom.exit();
        }

    } else {

        console.log(JSON.stringify({index : filmIndex, success : false,msg : 'interface capture fail!'}));

        page.close();
        phantom.exit();
    }

});

setTimeout(function(){
    console.log(JSON.stringify({index : filmIndex, success : false, msg : 'interface capture fail!'}));

    page.close();
    phantom.exit();
}, 60 * 1000);






