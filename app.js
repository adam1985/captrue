
/**
 * 使用命令
 *  node app [startIndex] [excuteType] [taskAmount]
 *
 */

var sys = require('sys'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    fork = require('child_process').fork,
    cpus = require('os').cpus(),
    dateFormat = require('./module/dateFormat'),
    tools = require('./module/tools'),
    getAllFilmList = require('./module/getAllFilmList');

var dirPath = './create/',
    backupPath = './backup/';

var proxyIpArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    proxyIpIndex = 0;

var random = function(){
    var len = proxyIpArr.length;
    return Math.floor( Math.random() * len );
};

/**
 * 处理参数
 * @type {Array}
 */

var arguments = process.argv.splice(2);
if( arguments.length < 3 ){
    throw new Error('至少需要三个参数');
}

var startIndex = parseInt(arguments[0]),
    excuteType = arguments[1],
    taskAmount = parseInt(arguments[2]),
    mlistIndex = startIndex;

//备份
dateFormat.format();
var initTime = new Date();
var dateString = initTime.format("yyyyMMddhhmmss");
spawn('cp', ["-r", dirPath, backupPath + dateString] );
console.log('成功备份数据');

//保存被子进程实例数组
var workers = {};
//这里的被子进程理论上可以无限多
var appsPath = [];
var createWorker = function(appPath){

    appPath.args[0] = random();
    //保存fork返回的进程实例
    var worker = fork(appPath.path, appPath.args, {silent:true});
    //监听子进程exit事件
    worker.on('exit',function(){
        console.log('worker:' + worker.pid + 'exited');
        delete workers[worker.pid];
        appPath.args[1] = -1;
        createWorker(appPath);
    });

    worker.stdout.on('data', function (stdout) {
        console.log(stdout.toString());
    });

    workers[worker.pid] = worker;
    console.log('Create worker:' + worker.pid);
};


getAllFilmList('flimlist.csv', function(data){
    var filmType = tools.trim(data[4]);
    return true;
}, function(mList){
    console.log('正在分配任务，请稍后...');
    console.log('总共有' + ( mList.length ) + '个影片关键词!');
    var tastSize = parseInt(mList.length / taskAmount),
        remainSize = mList % taskAmount,
        filmPath = dirPath + 'filmlist.txt';

    if(  startIndex == 0 ) {
        if( fs.existsSync( filmPath ) ){
            fs.unlinkSync( filmPath );
        }
    }

    mList.forEach(function(v){
        if(!fs.existsSync(filmPath)){
            fs.writeFileSync(filmPath, v + '\r\n');
        } else {
            fs.appendFileSync(filmPath, v + '\r\n');
        }
    });

    for(var i = 1; i <= taskAmount; i++){

        var tastName = dirPath + i,
            dataDir = tastName + '/data',
            backupDir = tastName + '/backup',
            fileName = tastName + '/filmlist.txt';

        if(  startIndex == 0 ) {
            if( fs.existsSync( fileName ) ){
                fs.unlinkSync( fileName );
            }
        }

        if( !fs.existsSync(tastName) ){
            //spawn('mkdir',[tastName]);
            //spawn('mkdir',[dataDir]);
            //spawn('mkdir',[backupDir]);
            fs.mkdirSync(tastName);
            fs.mkdirSync(dataDir);
            fs.mkdirSync(backupDir);
        }

        var tastList = mList.splice(0, tastSize), appendContent = '';
        tastList.forEach(function(v){
            appendContent +=  v + '\r\n';
        });

        if( i == taskAmount ) {
            mList.splice(0, remainSize).forEach(function(v){
                appendContent +=  v + '\r\n';
            });
        }

        fs.writeFileSync(fileName,appendContent );

        // >>node.log 2>&1  &
        /*spawn('node', ["index", random(), startIndex, excuteType, i]).stdout.on('data', function (stdout) {
            console.log(stdout.toString());
        });*/

        appsPath.push({
            path : './index.js',
            args :  [random(), startIndex, excuteType, i]
        });

    }

    //启动所有子进程
    for (var n = appsPath.length - 1; n >= 0; n--) {
        createWorker(appsPath[n]);
    }

    //父进程退出时杀死所有子进程
    process.on('exit',function(){
        for(var pid in workers){
            workers[pid].kill();
        }
    });

    console.log('已经启动服务，数据正在抓取!');

});

































