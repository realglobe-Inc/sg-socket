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

  it('Sg socket', () => co(function * () {
    let port = 9876
    let server = sgSocket(port)

    let client01 = sgSocketClient(`http://localhost:${port}`)
    yield client01.waitToConnect()

    let client02 = sgSocketClient(`http://localhost:${port}`)
    yield client02.waitToConnect()

    {
      let result = yield client01.lock('hoge')
      assert.equal(result.status, OK, 'succeeded to lock')
    }

    {
      let thrown
      try {
        yield client02.lock('hoge')
      } catch (err) {
        thrown = err
      }
      assert.ok(thrown, 'Failed to lock')
    }
    {
      let result = yield client02.lock('fuge')
      assert.equal(result.status, OK, 'succeeded to lock')
    }
    {
      let result = yield client01.unlock('hoge')
      assert.equal(result.status, OK, 'succeeded to unlock')
    }
    {
      let result = yield client02.lock('hoge')
      assert.equal(result.status, OK, 'succeeded to lock')
    }
    {
      let result = yield client02.unlock('hoge')
      assert.equal(result.status, OK, 'succeeded to lock')
    }
    {
      let result = yield client02.unlock('fuge')
      assert.equal(result.status, OK, 'succeeded to lock')
    }
    yield new Promise((resolve) => server.close(resolve()))
  }))
})

/* global describe, before, after, it */
