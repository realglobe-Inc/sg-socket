/**
 * Test case for lockingBind.
 * Runs with mocha.
 */
'use strict'

const lockingBind = require('../lib/bindings/locking_bind.js')
const sgSocket = require('../lib/sg_socket.js')
const sgSocketClient = require('sg-socket-client')
const assert = require('assert')
const co = require('co')
const { AcknowledgeStatus } = require('sg-socket-constants')
const { OK, NG } = AcknowledgeStatus

describe('locking-bind', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Create locking bind', async () => {
    assert.ok(lockingBind({}))
  })

  it('Lock / Unlock', async () => {
    let port = 9876
    let server = sgSocket(port)

    let client01 = sgSocketClient(`http://localhost:${port}`)
    await client01.waitToConnect()

    let client02 = sgSocketClient(`http://localhost:${port}`)
    await client02.waitToConnect()

    {
      let result = await client01.lock('hoge')
      assert.equal(result.status, OK, 'succeeded to lock')
    }

    {
      let thrown
      try {
        await client02.lock('hoge')
      } catch (err) {
        thrown = err
      }
      assert.ok(thrown, 'Failed to lock')
    }
    {
      let result = await client02.lock('fuge')
      assert.equal(result.status, OK, 'succeeded to lock')
    }
    {
      let result = await client01.unlock('hoge')
      assert.equal(result.status, OK, 'succeeded to unlock')
    }
    {
      let result = await client02.lock('hoge')
      assert.equal(result.status, OK, 'succeeded to lock')
    }
    {
      let result = await client02.unlock('hoge')
      assert.equal(result.status, OK, 'succeeded to lock')
    }

    await new Promise((resolve) => {
      client02.close()
      setTimeout(() => resolve(), 500)
    })

    {
      let result = await client01.lock('fuge')
      assert.equal(result.status, OK, 'succeeded to lock')
    }

    client01.close()

    await server.close()
  })
})

/* global describe, before, after, it */
