/**
 * Websocket server
 * @function sgSocket
 */
'use strict'

const socketIo = require('socket.io')

let sgSocket = socketIo.bind(socketIo)

Object.assign(sgSocket, socketIo, {})

module.exports = sgSocket
