
/usr/bin/nohup /usr/local/bin/node fetchIp 0

/usr/bin/nohup /usr/local/bin/node app -1 restart 20

kill -9 `ps -ef |grep xxx|awk '{print $2}' `

// 开发环境下
cd /root/phantom && forever start -l /root/phantom/log/forever.log -e /root/phantom/log/err.log -a app.js 0 restart 20 1

// 线上环境下
forever start -l log/forever.log -e log/err.log -w -a app.js 0 restart 20 1