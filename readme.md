# NSQjs Promise

Javescript nsq client base on `nsqjs` with promise.
一个基于 `nsqjs` 库进行 promise 化封装的 nsq 客户端.

# Installation
`npm install nsqjs-promise`

# Usage
```javascript
const NSQ = require('nsqjs-promise');
const autoFinish = require('nsqjs-promise/middlewares/auto_finish');

async function loggerMiddleware(message, next) {
  console.log(`handle message ${message.id} ...`);

  try {
    await next();
    console.log(`handle message ${message.id} succeed`);
  } catch (e) {
    console.log(`handle message ${message.id} failed`);
    throw e;
  }
}

async function main() {
  // $ nsqlookupd
  // $ nsqd --lookupd-tcp-address=127.0.0.1:4160
  // $ nsqadmin --lookupd-http-address=127.0.0.1:4161
  
  // ------------------------------  Reader  ----------------------------------
  const reader = new NSQ.Reader({
    topic: 'sample_topic', channel: 'sample_channel',
    lookupdHTTPAddresses: ['127.0.0.1:4161'],
    nsqdTCPAddresses: ['127.0.0.1:4150'],
  });

  reader.use(autoFinish);
  reader.use(loggerMiddleware);

  reader.all(
    (message) => {
      return { id: message.id, data: message.json() };
    },

    ({ id, data }) => {
      console.log(id, data);
    },
  );

  await reader.connect();

  // ------------------------------  Writer  ----------------------------------
  const writer = new NSQ.Writer({ host: '127.0.0.1', port: 4150 });

  await writer.publish('sample_topic', { fitst: 'one' });
  await writer.publish('sample_topic', { second: 'two' });

  await writer.close();
}

main();
/*
handle message 0b1666645e9b8000 ...
0b1666645e9b8000 { fitst: 'one' }
handle message 0b1666645e9b8000 succeed
handle message 0b166664605b8000 ...
0b166664605b8000 { second: 'two' }
handle message 0b166664605b8000 succeed
 */

```
