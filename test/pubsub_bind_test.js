/**
 * Test case for pubsubBind.
 * Runs with mocha.
 */
'use strict'

const pubsubBind = require('../lib/bindings/pubsub_bind.js')
const sgSocket = require('../lib/sg_socket.js')
const sgSocketClient = require('sg-socket-client')
const assert = require('assert')
const co = require('co')
const { AcknowledgeStatus } = require('sg-socket-constants')
const { OK, NG } = AcknowledgeStatus

describe('pubsub-bind', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Create pubsub bind', () => co(function * () {
    assert.ok(pubsubBind({}))
  }))

  it('Pub / Sub', () => co(function * () {
    let port = 9877
    let server = sgSocket(port)

    let client01 = sgSocketClient(`http://localhost:${port}`)
    yield client01.waitToConnect()

    let client02 = sgSocketClient(`http://localhost:${port}`)
    yield client02.waitToConnect()

    let topic01 = 'hogehoge'

    yield client01.raiseAsPublisher(topic01)

    let result = yield client01.publish(topic01, {})
    assert.equal(result.status, OK)

    yield new Promise((resolve, reject) => {
      client02.subscribe(topic01, (payload) => {
        assert.deepEqual(payload, { foo: 'bar' })
        client02.unsubscribe(topic01).then(() => {
          co(function * () {
            let result = yield client01.publish(topic01, { foo: 'bar' })
            let { count } = result.payload
            assert.equal(count, 0)
            resolve()
          }).catch(reject)
        })
      }).then(() => {
        co(function * () {
          let result = yield client01.publish(topic01, { foo: 'bar' })
          let { count } = result.payload
          assert.equal(count, 1)
        }).catch(reject)
      })
    })

    yield client01.shutAsPublisher(topic01)

    client01.close()
    client02.close()

    yield server.close()
  }))
})

/* global describe, before, after, it */
