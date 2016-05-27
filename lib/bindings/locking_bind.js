/**
 * Bind locking events
 * @function bindLock
 * @param {Object} socket
 * @param {Object} [options]
 * @returns {function}
 */
'use strict'

const { LockingEvents } = require('sg-socket-constants')
const { LOCK, UNLOCK, CONFLICT, ALLOC, RELEASE } = LockingEvents

/** @lends lockingBind */
function lockingBind (pool, options = {}) {
  return (socket) => {
    /**
     * Execute locking
     * @param name
     * @param by
     */
    function doLock (name, by) {
      pool[ name ] = { by, at: new Date() }
      socket.broadcast.emit(ALLOC, { name, by })
    }

    /**
     * Execute unlocking
     * @param name
     * @param by
     */
    function doUnlock (name, by) {
      delete pool[ name ]
      socket.broadcast.emit(RELEASE, { name, by })
    }

    socket.on(LOCK, (data) => {
      let { name, by } = data
      let pooled = pool[ name ]
      if (pooled) {
        socket.emit(CONFLICT, { name })
      } else {
        doLock(name, by)
      }
    })

    socket.on(UNLOCK, (data) => {
      let { name, by } = data
      let pooled = pool[ name ]
      if (pooled) {
        let ok = pooled.by === by
        if (ok) {
          doUnlock(name, by)
        } else {
          socket.emit('error', 'Invalid unlock')
        }
      }
    })

    socket.on('disconnect', () => {
      for (let name of Object.keys(pool)) {
        var { by } = pool[ name ]
        if (by === socket.id) {
          doUnlock(name, by)
        }
      }
    })
  }
}

module.exports = lockingBind
