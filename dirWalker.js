var fs = require('fs');

/*

 递归处理文件,文件夹

 path 路径
 floor 层数
 handleFile 文件,文件夹处理函数

 */

function walk(path, handleFile) {
    fs.readdir(path, function(err, files) {
        if (err) {
            console.log('read dir error');
        } else {
            files.forEach(function(item) {
                var tmpPath = path + '/' + item;
                fs.stat(tmpPath, function(err1, stats) {
                    if (err1) {
                        console.log('stat error');
                    } else {
                        if (stats.isDirectory()) {
                            walk(tmpPath, handleFile);
                        } else {
                            handleFile(tmpPath);
                        }
                    }
                })
            });

        }
    });
}

exports.walk = walk;