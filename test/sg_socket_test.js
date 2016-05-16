/**
 * Test case for sgSocket.
 * Runs with mocha.
 */
'use strict'

const sgSocket = require('../lib/sg_socket.js')
const assert = require('assert')
const co = require('co')

describe('sg-socket', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Sg socket', () => co(function * () {
    let server = sgSocket(9876)

    yield new Promise((resolve) =>
      server.close(resolve())
    )
  }))
})

/* global describe, before, after, it */
