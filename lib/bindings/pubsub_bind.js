/**
 * Bind pubsub events
 * @function pubsubBind
 * @param {Object} pool - Handler pool
 * @param {Object} [options]
 * @returns {function}
 */
'use strict'

const { PubsubEvents, ReservedEvents, AcknowledgeStatus } = require('sg-socket-constants')
const {
  // From subscribers
  SUBSCRIBE,
  UNSUBSCRIBE,
  // To subscribers
  READY,
  GONE,
  RECEIVE,
  // From publishers
  OPEN,
  CLOSE,
  PUBLISH,
  // To publishers
  COUNT
} = PubsubEvents
const { OK, NG } = AcknowledgeStatus
const { RECONNECT, DISCONNECT } = ReservedEvents

let ok = (payload) => ({ status: OK, payload })
let ng = (payload) => ({ status: NG, payload })

/**
 * SocketHolder of topics
 */
class SocketHolder {
  constructor (sockets) {
    const s = this
    if (sockets instanceof SocketHolder) {
      s.sockets = sockets.sockets
    } else {
      s.sockets = sockets
    }
  }

  emitSockets (topic, event, data) {
    const s = this
    let sockets = s.sockets[ topic ] || {}
    for (let id of Object.keys(sockets)) {
      let socket = sockets[ id ]
      socket.emit(event, data)
    }
  }

  countSockets (topic) {
    const s = this
    return Object.keys(s.sockets[ topic ] || {}).length
  }

  addSocket (topic, socket) {
    const s = this
    s.sockets[ topic ] = s.sockets[ topic ] || {}
    let before = s.countSockets(topic)
    s.sockets[ topic ][ socket.id ] = socket
    let after = s.countSockets(topic)
    return after - before
  }

  removeSocket (topic, id) {
    const s = this
    let count = 0
    let deletable = s.sockets[ topic ] && s.sockets[ topic ][ id ]
    if (deletable) {
      delete s.sockets[ topic ]
      count += 1
    }
    return count
  }

  topicsForSockets (socketId) {
    const s = this
    return Object.keys(s.sockets)
      .filter((topic) => s.sockets[ topic ].hasOwnProperty(socketId))
  }

}

/** @lends pubsubBind */
function pubsubBind (pool, options = {}) {
  pool.pub = new SocketHolder(pool.pub || {})
  pool.sub = new SocketHolder(pool.sub || {})

  return function bindPubsub (socket) {
    let { pub, sub } = pool
    socket.on(OPEN, (data, callback) => {
      let { id } = socket
      let { topic } = data
      pub.addSocket(topic, socket)
      sub.emitSockets(topic, READY, { topic, publisherId: id })
      callback(ok())
    })

    socket.on(CLOSE, (data, callback) => {
      let { id } = socket
      let { topic } = data
      let count = pub.removeSocket(topic, id)
      callback(ok({ count }))
    })

    socket.on(PUBLISH, (data, callback) => {
      let { id } = socket
      let { topic, payload } = data
      sub.emitSockets(topic, RECEIVE, { topic, payload, by: id })
      callback(ok())
    })

    socket.on(SUBSCRIBE, (data, callback) => {
      let { id } = socket
      let { topic } = data
      let count = sub.addSocket(topic, socket)
      if (count > 0) {
        pub.emitSockets(topic, COUNT, {
          sub: sub.countSockets(topic)
        })
      }
      callback(ok())
    })

    socket.on(UNSUBSCRIBE, (data, callback) => {
      let { id } = socket
      let { topic } = data
      let count = sub.removeSocket(topic, id)
      if (count > 0) {
        pub.emitSockets(topic, COUNT, {
          sub: sub.countSockets(topic)
        })
      }
      callback(ok({ count }))
    })

    // Cleanup on disconnect
    socket.on(DISCONNECT, () => {
      let { id } = socket
      for (let topic of sub.topicsForSockets(id)) {
        sub.removeSocket(topic, id)
        pub.emitSockets(topic, COUNT, {
          sub: sub.countSockets(topic)
        })
      }
      for (let topic of pub.topicsForSockets(id)) {
        pub.removeSocket(topic, id)
      }
    })
  }
}

module.exports = pubsubBind
