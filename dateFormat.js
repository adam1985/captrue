var format = function(){
    Date.prototype.format = function(format){
        var o = {
            "M+" : this.getMonth()+1, //month
            "d+" : this.getDate(), //day
            "h+" : this.getHours(), //hour
            "m+" : this.getMinutes(), //minute
            "s+" : this.getSeconds(), //second
            "q+" : Math.floor((this.getMonth()+3)/3), //quarter
            "S" : this.getMilliseconds() //millisecond
        };

        if(/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
        }

        for(var k in o) {
            if(new RegExp("("+ k +")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
            }
        }
        return format;
    };
};

var formatSa = function( times ){
    var second = 1000,
        minute = second * 60,
        hour = minute * 60,
        day = hour * 24;

    if( times < second ) {
        return "1s"
    } else if( times >= second && times <  minute) {
        return parseInt(times / second ) + "秒";
    } if( times >= minute && times < hour ) {
        return parseInt(parseInt(times / minute) ) + "分" + parseInt(times % minute / second ) + "秒";
    } if( times >= hour && times < day ) {
        return parseInt(parseInt(times / hour) ) + "时" + parseInt(parseInt(times % hour / minute ) ) + "分" +
            parseInt(times % hour % minute / second) + "秒";
    } else if( times >= day ){
        return parseInt(parseInt(times / day) ) + "天" +
            parseInt(parseInt(times % day / hour) ) + "时" +
            parseInt(parseInt(times % day % hour / minute ) ) + "分" +
            parseInt(times % day % hour % minute / second) + "秒";
    }
};

exports.format = format;
exports.formatSa = formatSa;
