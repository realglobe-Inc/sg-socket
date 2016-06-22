/**
 * Web Socket server
 * @function sgSocket
 */
'use strict'

const socketIo = require('socket.io')
const debug = require('debug')('sg:socket')

const bindings = require('./bindings')

const { ReservedEvents } = require('sg-socket-constants')
const { CONNECTION, DISCONNECT } = ReservedEvents

let logListening = (port) => console.log(`WebSocket server listening on port: ${port}`)

function sgSocket (...args) {
  let wsServer = socketIo(...args)
  let { httpServer } = wsServer

  let { port } = (httpServer.address() || {})

  if (port) {
    logListening(port)
  } else {
    httpServer.on('listening', () => logListening(httpServer.address().port))
  }

  let total = () => Object.keys(wsServer.sockets.sockets).length

  let bindLock = bindings.lockingBind({})
  let bindPubsub = bindings.pubsubBind({})

  wsServer.on(CONNECTION, (socket) => {
    debug(`New WebSocket Connection (${total()} total)`)

    socket.on(DISCONNECT, () => {
      debug(`Disconnected WebSocket (${total()} total)`)
    })

    bindLock(socket)
    bindPubsub(socket)
  })

  wsServer.close = function promiseClose () {
    // TODO Remove callback fallback
    /** @deprecated */
    let callback
    if (typeof arguments[ 0 ] === 'function') {
      console.warn('Callback is deprecated. Use promise instead')
      callback = arguments[ 0 ]
    }
    return new Promise((resolve, reject) =>
      httpServer.close(() => {
        if (callback) {
          callback()
        }
        resolve()
      })
    )
  }

  return wsServer
}

Object.assign(sgSocket, socketIo, {})

module.exports = sgSocket
