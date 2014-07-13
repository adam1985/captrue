Buffer.concat = function(list, length)
{
  if(!Array.isArray(list))
  {
    throw new Error('Usage:Buffer.concat(list, [length])');
  }

  if(list.length === 0)
  {
    return new Buffer(0);
  }
  else if(list.length === 1)
  {
    return list[0];
  }

  if(typeof length !== 'number')
  {
    length = 0;
    for(var i=0; i<list.length; i++)
    {
      var buf = list[i];
      length += buf.length;
    }
  }

  var buffer = new Buffer(length);
  var pos = 0;
  for(var i=0; i<list.length; i++)
  {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

	/*var chunks = [], size = 0;
	
	var rs = fs.createReadStream('mname.csv');
	//rs.setEncoding('utf8');
	rs.on('data', function(chunk){
		chunks.push(chunk);
		size += chunk.length;
	});
	rs.on('end', function(){
		var buf = Buffer.concat(chunks, size);
		var str = iconv.decode(buf, 'utf8');
		mlist = str.split(/\s+/);
		len = mlist.length;
		proxys = proxyList;
		excuteExec();
	});*/