/**
 * WebSocket server for SUGOS
 * @module sg-socket
 * @version 3.0.0
 */
'use strict'

const sgSocket = require('./sg_socket')

let lib = sgSocket.bind(this)

Object.assign(lib, sgSocket, {
  sgSocket
})

module.exports = lib
