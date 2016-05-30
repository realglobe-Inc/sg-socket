/**
 * Bind locking events
 * @function bindLock
 * @param {Object} socket
 * @param {Object} [options]
 * @returns {function}
 */
'use strict'

const { LockingEvents, ReservedEvents, AcknowledgeStatus } = require('sg-socket-constants')
const { LOCK, UNLOCK, ALLOC, RELEASE } = LockingEvents
const { OK, NG } = AcknowledgeStatus
const { DISCONNECT, ERROR } = ReservedEvents

/** @lends lockingBind */
function lockingBind (pool, options = {}) {
  return function bindLock (socket) {
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

    socket.on(LOCK, (data, callback) => {
      let { name, by } = data
      let pooled = pool[ name ]
      if (pooled) {
        callback({
          status: NG,
          payload: 'Already taken'
        })
      } else {
        doLock(name, by)
        callback({
          status: OK
        })
      }
    })

    socket.on(UNLOCK, (data, callback) => {
      let { name, by } = data
      let pooled = pool[ name ]
      if (pooled) {
        let ok = pooled.by === by
        if (ok) {
          doUnlock(name, by)
          callback({
            status: OK
          })
        } else {
          callback({
            status: NG,
            payload: 'Wrong "by"'
          })
        }
      }
    })

    socket.on(DISCONNECT, () => {
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
