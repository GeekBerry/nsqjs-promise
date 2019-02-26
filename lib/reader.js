const NSQJs = require('nsqjs');

class Reader extends NSQJs.Reader {
  constructor({
    topic,
    channel,
    lookupdHTTPAddresses = ['127.0.0.1:4161'],
    nsqdTCPAddresses = ['127.0.0.1:4150'],
    ...rest
  } = {}) {
    if (!topic || !channel) {
      throw new Error(`topic or channel can not be empty, topic= "${topic}", channel="${channel}"`);
    }

    super(topic, channel, {
      lookupdHTTPAddresses,
      nsqdTCPAddresses,
      ...rest,
    });

    this.middlewares = [];
  }

  toString() {
    return `${this.constructor.name} topic="${this.topic}", channel="${this.channel}"`;
  }

  loadMiddleWares() {
    let onMessage = () => {};
    // 倒序加载
    for (let index = this.middlewares.length - 1; index >= 0; index -= 1) {
      const middleware = this.middlewares[index];

      const nextOnMessage = onMessage;
      onMessage = function (message) {
        function next() {
          return nextOnMessage(message);
        }

        middleware.bind(this)(message, next);
      };
    }

    return onMessage;
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  all(...functions) {
    async function middleware(message, next) {
      let ret = message;
      for (const func of functions) {
        ret = await func(ret, message);
      }

      await next();
    }

    this.use(middleware);
  }

  async connect() {
    this.on(Reader.MESSAGE, this.loadMiddleWares());

    return new Promise((resolve, reject) => {
      this.debug(`${this.toString()} connecting...`);

      this.on(Reader.NSQD_CONNECTED, (host) => {
        this.debug(`${this.toString()} connected to host "${host}"`);
        resolve(host);
      });

      this.on(Reader.ERROR, (error) => {
        this.debug(`${this.toString()} error ${error}`);
        reject(error);
      });

      super.connect();
    });
  }

  async close() {
    const closedPromise = new Promise((resolve) => {
      this.on(Reader.NSQD_CLOSED, () => {
        this.debug(`${this.toString()} connected to closed`);
        resolve();
      });
    });

    this.debug(`${this.toString()} closing...`);
    super.close();
    return closedPromise;
  }
}

module.exports = Reader;
