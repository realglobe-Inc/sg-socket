/**
 * Binding modules
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get lockingBind () { return d(require('./locking_bind')) },
  get pubsubBind () { return d(require('./pubsub_bind')) }
}
