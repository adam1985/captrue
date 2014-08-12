/**
 * 使用命令
 *  node index [proxyIndex] [startIndex] [excuteType] [taskIndex]
 *
 */

var sys = require('sys'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    fork = require('child_process').fork,
    urlencode = require('urlencode'),
    nodeCsv = require('node-csv'),
    os = require('os'),
    net = require('net'),
    iconv = require('iconv-lite'),
    lineReader = require('line-reader'),

    dirWalker = require('./module/dirWalker'),
    dateFormat = require('./module/dateFormat'),
    info = require('./module/info'),
    base64 =  require('./module/base64.js'),
    tools = require('./module/tools'),
    readJson = require('./module/readJson'),
    getFilmList = require('./module/getFilmList');







