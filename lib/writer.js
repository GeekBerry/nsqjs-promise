const NSQJs = require('nsqjs');

class Writer extends NSQJs.Writer {
  constructor({
    host = '127.0.0.1',
    port = '4150',
    ...rest
  } = {}) {
    super(host, port, rest);

    this.on(Writer.ERROR, (error) => {
      this.debug(`${this.toString()} ${error}`);
      throw new Error(error);
    });

    this.connect();
  }

  toString() {
    return `${this.constructor.name} host="${this.nsqdHost}", port="${this.nsqdPort}"`;
  }

  async publish(topic, message) {
    if (!this.ready) {
      await new Promise(resolve => this.on(Writer.READY, resolve));
    }

    return new Promise((resolve, reject) => {
      super.publish(topic, message, (err) => {
        if (err) {
          this.debug(`${this.toString()} publish topic="${topic}" failed`);
          reject(err);
        } else {
          this.debug(`${this.toString()} publish topic="${topic}" succeed`);
          resolve();
        }
      });
    });
  }

  async close() {
    if (!this.ready) {
      return undefined;
    }

    // 需要先设定 on Writer.CLOSED 再调用 close
    const closedPromise = new Promise((resolve) => {
      this.on(Writer.CLOSED, () => {
        this.debug(`${this.toString()} closed`);
        resolve();
      });
    });

    this.debug(`${this.toString()} closing...`);
    super.close();

    return closedPromise;
  }
}

module.exports = Writer;
