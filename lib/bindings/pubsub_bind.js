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
  RECEIVE,
  // From publishers
  RAISE,
  SHUT,
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

  hasSocket (topic, id) {
    const s = this
    return s.sockets[ topic ] && s.sockets[ topic ][ id ]
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

    let countsOfTopic = (topic) => ({
      pub: pub.countSockets(topic),
      sub: sub.countSockets(topic)
    })

    socket.on(RAISE, (data, callback) => {
      let { id } = socket
      let { topic } = data
      let count = pub.addSocket(topic, socket)
      if (count > 0) {
        sub.emitSockets(topic, COUNT, countsOfTopic(topic))
      }
      callback(ok({ count }))
    })

    socket.on(SHUT, (data, callback) => {
      let { id } = socket
      let { topic } = data
      let count = pub.removeSocket(topic, id)
      if (count > 0) {
        sub.emitSockets(topic, COUNT, countsOfTopic(topic))
      }
      callback(ok({ count }))
    })

    socket.on(PUBLISH, (data, callback) => {
      let { id } = socket
      let { topic, payload } = data
      let hasRaised = pub.hasSocket(topic, socket.id)
      if (!hasRaised) {
        callback(ng(`Invalid publisher with topic: "${topic}". Call raise before publishing`))
        return
      }
      sub.emitSockets(topic, RECEIVE, { topic, payload, by: id })
      callback(ok())
    })

    socket.on(SUBSCRIBE, (data, callback) => {
      let { id } = socket
      let { topic } = data
      let count = sub.addSocket(topic, socket)
      if (count > 0) {
        pub.emitSockets(topic, COUNT, countsOfTopic(topic))
      }
      pub.emitSockets(topic, COUNT, countsOfTopic(topic))
      callback(ok())
    })

    socket.on(UNSUBSCRIBE, (data, callback) => {
      let { id } = socket
      let { topic } = data
      let count = sub.removeSocket(topic, id)
      if (count > 0) {
        pub.emitSockets(topic, COUNT, countsOfTopic(topic))
      }
      callback(ok({ count }))
    })

    // Cleanup on disconnect
    socket.on(DISCONNECT, () => {
      let { id } = socket
      for (let topic of sub.topicsForSockets(id)) {
        let count = sub.removeSocket(topic, id)
        if (count > 0) {
          pub.emitSockets(topic, COUNT, countsOfTopic(topic))
        }
      }

      for (let topic of pub.topicsForSockets(id)) {
        let count = pub.removeSocket(topic, id)
        if (count > 0) {
          sub.emitSockets(topic, COUNT, countsOfTopic(topic))
        }
      }
    })
  }
}

module.exports = pubsubBind
