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
const {AcknowledgeStatus} = require('sg-socket-constants')
const {OK, NG} = AcknowledgeStatus

describe('pubsub-bind', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Create pubsub bind', async () => {
    assert.ok(pubsubBind({}))
  })

  it('Pub / Sub', async () => {
    let port = 9877
    let server = sgSocket(port)

    let client01 = sgSocketClient(`http://localhost:${port}`)
    await client01.waitToConnect()

    let client02 = sgSocketClient(`http://localhost:${port}`)
    await client02.waitToConnect()

    let topic01 = 'hogehoge'

    await client01.raiseAsPublisher(topic01)

    let result = await client01.publish(topic01, {})
    assert.equal(result.status, OK)

    await new Promise((resolve, reject) => {
      client02.subscribe(topic01, (payload) => {
        assert.deepEqual(payload, {foo: 'bar'})
        client02.unsubscribe(topic01).then(async () => {
          try {
            let result = await client01.publish(topic01, {foo: 'bar'})
            let {count} = result.payload
            assert.equal(count, 0)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      }).then(async () => {
        try {
          let result = await client01.publish(topic01, {foo: 'bar'})
          let {count} = result.payload
          assert.equal(count, 1)
        } catch (e) {
          reject(e)
        }
      })
    })

    await client01.shutAsPublisher(topic01)

    client01.close()
    client02.close()

    await server.close()
  })
})

/* global describe, before, after, it */
