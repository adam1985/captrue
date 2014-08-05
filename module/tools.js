
    var tools_ = {};

    /**
     * jQuery.each方法
     * @param obj 待处理对象
     * @param callback 处理程序
     * @param args 传给callback的参数
     */
    tools_.each = function( obj, callback, args ) {
        var name,
            i = 0,
            length = obj.length,
            isObj = length === undefined || goog.isFunction( obj );

        if ( args ) {
            if ( isObj ) {
                for ( name in obj ) {
                    if ( callback.apply( obj[ name ], args ) === false ) {
                        break;
                    }
                }
            } else {
                for ( ; i < length; ) {
                    if ( callback.apply( obj[ i++ ], args ) === false ) {
                        break;
                    }
                }
            }

            // A special, fast, case for the most common use of each
        } else {
            if ( isObj ) {
                for ( name in obj ) {
                    if ( callback.call( obj[ name ], name, obj[ name ] ) === false ) {
                        break;
                    }
                }
            } else {
                for ( ; i < length; ) {
                    if ( callback.call( obj[ i ], i, obj[ i++ ] ) === false ) {
                        break;
                    }
                }
            }
        }

        return obj;
    };

    /**
     * 把HTMLCollection/NodeList/伪数组转换成数组
     * @param nodeList 待转换HTMLCollection/NodeList
     * @returns {Array}
     */
    tools_.makeArray = function ( nodeList ) {
        var len = nodeList.length;
        if( len ) {
            var res = [];
            for(var i = 0; i < len; i++ ){
                res.push( nodeList[i] );
            }
            return res;
        }
    };

    /**
     * 模拟jQuery.extend方法
     * @param arg 源数据
     * @param dft 新数据
     * @param cover 是否覆盖
     * @returns {object}
     */

    tools_.extend = function (arg, dft, cover) {
        for (var key in dft) {
            if ( cover ) {
                arg[key] = dft[key];
            } else {
                if (typeof arg[key] == 'undefined') {
                    arg[key] = dft[key];
                }
            }

        }
        return arg;
    };

    tools_.trim = function(str) {
        return str.replace(/^\s+|\s+$/gm, '');
    };

    tools_.unique = function (data, isDeep, name){
        data = data || [];
        var a = {}, res = [];
        for (var i=0; i<data.length; i++) {
            var v, key;
            if( isDeep ) {
                key = data[i][name];
                v = data[i];
            } else {
                key = v = data[i];
            }

            if (typeof(a[key]) == 'undefined'){
                a[key] = 1;
                res.push( v );
            }
        }

        return res;
    };

    module.exports = tools_ ;
