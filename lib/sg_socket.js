/**
 * Websocket server
 * @function sgSocket
 */
'use strict'

const socketIo = require('socket.io')
const debug = require('debug')('sg:socket')

function sgSocket (...args) {
  let wsServer = socketIo(...args)
  let { httpServer } = wsServer
  let { port } = httpServer.address()
  console.log(`WebSocket server listening on port: ${port}`)

  let total = () => Object.keys(wsServer.sockets.sockets).length
  wsServer.on('connection', (socket) => {
    debug(`New WebSocket Connection (${total()} total)`)

    socket.on('disconnect', () => {
      debug(`Disconnected WebSocket (${total()} total)`)
    })
  })

  return wsServer
}

Object.assign(sgSocket, socketIo, {})

module.exports = sgSocket
