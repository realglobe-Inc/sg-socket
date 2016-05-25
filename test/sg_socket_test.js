/**
 * Test case for sgSocket.
 * Runs with mocha.
 */
'use strict'

const sgSocket = require('../lib/sg_socket.js')
const sgSocketClient = require('sg-socket-client')
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
    yield new Promise((resolve) => client01.on('connect', () => resolve()))

    let client02 = sgSocketClient(`http://localhost:${port}`)
    yield new Promise((resolve) => client02.on('connect', () => resolve()))

    client01.lock('hoge')
    yield new Promise((resolve) => {
      client02.on('sg:alloc', (data) => {
        assert.equal(data.name, 'hoge')
        resolve()
      })
    })

    client02.lock('hoge')
    yield new Promise((resolve) => {
      client02.on('sg:conflict', (data) => {
        assert.equal(data.name, 'hoge')
        resolve()
      })
    })

    client01.unlock('hoge')
    yield new Promise((resolve) => {
      client02.on('sg:release', (data) => {
        assert.equal(data.name, 'hoge')
        resolve()
      })
    })

    yield new Promise((resolve) => server.close(resolve()))
  }))
})

/* global describe, before, after, it */
