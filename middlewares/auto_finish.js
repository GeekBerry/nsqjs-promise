/**
 * 自动 finish nsq 的 message
 * @param message {Object}
 * @param next {Function}
 * @return {Promise<void>}
 */
async function autoFinish(message, next) {
  try {
    await next();
    message.finish();
  } catch (e) {
    message.requeue();
  }
}

module.exports = autoFinish;
