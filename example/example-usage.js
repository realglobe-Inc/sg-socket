'use strict'

const sgSocket = require('sg-socket')

const server = sgSocket(8080)

server.sockets = {}
server.on('connection', (socket) => {
  socket.emit('app:ready')
  socket.on('app:hey', (data) => {
    socket.broadcast.emit('hi', data.msg)
  })
  socket.on('disconnect', () => {
    socket.broadcast.emit('goodbye, everyone')
  })
})
