var page = require('webpage').create();
var fs = require('fs');
var sys =  require('system');
var base64 =  require('./module/base64.js');
var $ = require('./module/jquery-2.1.1.min');


var filmIndex = sys.args[1],
    fileName = base64.decode(sys.args[2]);

// 百度指数必需的核心cookie，登陆百度帐号后获取
phantom.addCookie({
    'name'  : 'BDUSS',
    'value' : 'kwbElxRlYtQUR4OGhJRHJXOFRVaGNwQX5QVzRhc1RMTDdFYVZiYW14VnpodVZUQVFBQUFBJCQAAAAAAAAAAAEAAAAPqGVNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHP5vVNz-b1Tdm',
    'domain': '.baidu.com',
    'path'  : '/'
});

var timeout = 30 * 1000;

page.settings.resourceTimeout = timeout;

//抓取接口文件
var captrueInterface = function( config, callback ) {
    var interfacePath = 'http://index.baidu.com/Interface/';

        var postParamStr = page.evaluate(function() {
            return {
                res : PPval.ppt,
                res2 : PPval.res2
            };
        });

        var index = 0, len = config.interfaces.length;

        (function(){
            if( index < len ) {
                var args = arguments,
                    targetObj = config.interfaces[index],
                    key = Object.keys(targetObj)[0],
                    val = targetObj[key],
                    postUrl = interfacePath + val + '?' + $.param( postParamStr );

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

                            var isComplete = ( index === len - 1 ),
                                resJson = {
                                    index : filmIndex,
                                    success : true,
                                    content : content,
                                    msg : key + '.json interface suceess capture!'
                                };

                            console.log(JSON.stringify(resJson));

                            if( isComplete ) {
                                page.close();
                                callback && callback();
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

};


// 入口文件，开始抓取工作
var captureIndex = 0;
var openBaiduIndex = function( settings ) {
    settings  = settings || [];
    var length = settings.length;
    if( length ){
        (function(){
            var arg = arguments;
            if( captureIndex < length ) {
                pageCof = settings[captureIndex];
                captureIndex++;
                page.open(pageCof.url + fileName, function(status) {

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

                        var proxyBlock =  page.evaluate(function () {
                            return  document.querySelectorAll('#userbar').length == 0;
                        });

                        //console.log( isResult );

                        if( proxyBlock ) {
                            console.log(JSON.stringify({index : filmIndex, block : true, success : false, msg : 'proxy ip block!!!'}));

                            page.close();
                            phantom.exit();
                        } else {
                            if( isResult ) {
                                // 生成接口文件
                                captrueInterface( pageCof, function(){
                                    arg.callee();
                                } );
                            } else {
                                console.log(JSON.stringify({index : filmIndex, noneres : true, success : false,msg : 'keyword none result!!!'}));
                                page.close();
                                phantom.exit();
                            }
                        }

                    } else {

                        console.log(JSON.stringify({index : filmIndex, success : false, msg : 'interface capture fail!'}));

                        page.close();
                        phantom.exit();
                    }

                });
            } else {
                console.log(JSON.stringify({index : filmIndex, complete : true, msg : 'interface capture complate!'}));
				page.close();
                phantom.exit();
            }

        }());
    }

};

openBaiduIndex([
    {
        url : 'http://index.baidu.com/?tpl=crowd&word=',
        index : filmIndex,
        interfaces : [
            {
                "getSocial" : "Social/getSocial/"
            }
        ]
    }
]);

/*page.onError = function(msg, trace) {
    console.log(JSON.stringify({index : filmIndex, success : false, msg : 'interface capture fail!'}));
    page.close();
    phantom.exit();
};

phantom.onError = function(msg, trace) {
    console.log(JSON.stringify({index : filmIndex, success : false, msg : 'interface capture fail!'}));
    page.close();
    phantom.exit();
};*/

/*
page.onResourceError = function(){
    console.log(JSON.stringify({index : filmIndex, success : false, msg : 'interface capture fail!'}));
    page.close();
    phantom.exit();
};
*/

page.onResourceTimeout = function(){
    console.log(JSON.stringify({index : filmIndex, success : false, msg : 'interface capture fail!'}));
    page.close();
    phantom.exit();
};

setTimeout(function(){
     console.log(JSON.stringify({index : filmIndex, success : false, msg : 'interface capture fail!'}));
     page.close();
     phantom.exit();

 }, timeout);






