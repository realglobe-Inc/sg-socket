/**
 * Test case for sgSocket.
 * Runs with mocha.
 */
'use strict'

const sgSocket = require('../lib/sg_socket.js')
const sgSocketClient = require('sg-socket-client')
const { AcknowledgeStatus } = require('sg-socket-constants')
const { OK, NG } = AcknowledgeStatus
const assert = require('assert')
const co = require('co')

describe('sg-socket', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Start and stop server', () => co(function * () {
    let port = 9876
    let server = sgSocket(port)
    yield server.close()
  }))

})

/* global describe, before, after, it */
