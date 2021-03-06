/**
 * Bind locking events
 * @function bindLock
 * @param {Object} pool - Locking pool
 * @param {Object} [options]
 * @returns {function}
 */
'use strict'

const { LockingEvents, ReservedEvents, AcknowledgeStatus } = require('sg-socket-constants')
const { LOCK, UNLOCK, ALLOC, RELEASE } = LockingEvents
const { OK, NG } = AcknowledgeStatus
const { DISCONNECT } = ReservedEvents

let ok = (payload) => ({ status: OK, payload })
let ng = (payload) => ({ status: NG, payload })

const debug = require('debug')('sg:socket:locking')

/** @lends lockingBind */
function lockingBind (pool, options = {}) {
  return function bindLock (socket) {
    /**
     * Execute locking
     * @param {string} name
     * @param {string} by
     */
    function doLock (name, by) {
      debug(`Alloc new lock "${name} to ${by}`)
      pool[ name ] = { by, at: new Date() }
      socket.broadcast.emit(ALLOC, { name, by })
    }

    /**
     * Execute unlocking
     * @param {string} name
     * @param {string} by
     */
    function doUnlock (name, by) {
      debug(`Release a lock "${name} from ${by}`)
      delete pool[ name ]
      socket.broadcast.emit(RELEASE, { name, by })
    }

    // Handle lock event
    socket.on(LOCK, (data, callback) => {
      let { name, by } = data
      let pooled = pool[ name ]
      if (pooled) {
        callback(ng('Already taken'))
      } else {
        doLock(name, by)
        callback(ok())
      }
    })

    // Handle unlock event
    socket.on(UNLOCK, (data, callback) => {
      let { name, by } = data
      let pooled = pool[ name ]
      if (pooled) {
        let valid = pooled.by === by
        if (valid) {
          doUnlock(name, by)
          callback(ok())
        } else {
          callback(ng('Wrong "by"'))
        }
      } else {
        callback(ok()) // Do nothing if already unlocked
      }
    })

    // Cleanup on disconnect
    socket.on(DISCONNECT, () => {
      for (let name of Object.keys(pool)) {
        let { by } = pool[ name ]
        let hit = by === socket.client.id
        if (hit) {
          doUnlock(name, by)
        }
      }
    })
  }
}

module.exports = lockingBind
