
function buildTests(opts) {
  var builder = opts.builder
    , test    = opts.test

  test('support on and emit', function(t) {
    t.plan(4)

    var e = builder()
      , expected = {
            topic: 'hello world'
          , payload: { my: 'message' }
        }

    e.on('hello world', function(message, cb) {
      t.equal(e.current, 1, 'number of current messages')
      t.deepEqual(message, expected)
      t.equal(this, e)
      cb()
    })

    e.emit(expected, function() {
      e.close(function() {
        t.pass('closed')
      })
    })
  })

  test('support multiple subscribers', function(t) {
    t.plan(3)

    var e = builder()
      , expected = {
            topic: 'hello world'
          , payload: { my: 'message' }
        }

    e.on('hello world', function(message, cb) {
      t.ok(message, 'message received')
      cb()
    })

    e.on('hello world', function(message, cb) {
      t.ok(message, 'message received')
      cb()
    })

    e.emit(expected, function() {
      e.close(function() {
        t.pass('closed')
      })
    })
  })

  test('support multiple subscribers and unsubscribers', function(t) {
    t.plan(2)

    var e = builder()
      , expected = {
            topic: 'hello world'
          , payload: { my: 'message' }
        }

    function first(message, cb) {
      t.fail('first listener should not receive any events')
      cb()
    }

    function second(message, cb) {
      t.ok(message, 'second listener must receive the message')
      cb()
      e.close(function() {
        t.pass('closed')
      })
    }

    e.on('hello world', first)
    e.on('hello world', second)
    e.removeListener('hello world', first)

    e.emit(expected)
  })

  test('removeListener', function(t) {
    t.plan(1)

    var e = builder()
      , expected = {
            topic: 'hello world'
          , payload: { my: 'message' }
        }
      , toRemoveCalled = false

    e.on('hello world', function(message, cb) {
      cb()
    })

    function toRemove(message, cb) {
      toRemoveCalled = true
      cb()
    }

    e.on('hello world', toRemove)

    e.removeListener('hello world', toRemove)

    e.emit(expected, function() {
      e.close(function() {
        t.notOk(toRemoveCalled, 'the toRemove function must not be called')
      })
    })
  })

  test('without a callback on emit', function(t) {
    t.plan(1)

    var e = builder()
      , expected = {
            topic: 'hello world'
          , payload: { my: 'message' }
        }

    e.on('hello world', function(message, cb) {
      cb()
      e.close(function() {
        t.pass('closed')
      })
    })

    e.emit(expected)
  })

  test('without any listeners', function(t) {
    t.plan(2)

    var e = builder()
      , expected = {
            topic: 'hello world'
          , payload: { my: 'message' }
        }

    e.emit(expected)
    t.equal(e.current, 0, 'reset the current messages trackers')
    e.close(function() {
      t.pass('closed')
    })
  })

  test('support one level wildcard', function(t) {
    t.plan(2)

    var e = builder()
      , expected = {
            topic: 'hello/world'
          , payload: { my: 'message' }
        }

    e.on('hello/+', function(message, cb) {
      t.equal(message.topic, 'hello/world')
      cb()
    })

    // this will not be catched
    e.emit({ topic: 'hello/my/world' })

    // this will be catched
    e.emit(expected, function() {
      e.close(function() {
        t.pass('closed')
      })
    })
  })

  test('support changing one level wildcard', function(t) {
    t.plan(2)

    var e = builder({ wildcardOne: '~' })
      , expected = {
            topic: 'hello/world'
          , payload: { my: 'message' }
        }

    e.on('hello/~', function(message, cb) {
      t.equal(message.topic, 'hello/world')
      cb()
    })

    e.emit(expected, function() {
      e.close(function() {
        t.pass('closed')
      })
    })
  })

  test('support deep wildcard', function(t) {
    t.plan(2)

    var e = builder()
      , expected = {
            topic: 'hello/my/world'
          , payload: { my: 'message' }
        }

    e.on('hello/#', function(message, cb) {
      t.equal(message.topic, 'hello/my/world')
      cb()
    })

    e.emit(expected, function() {
      e.close(function() {
        t.pass('closed')
      })
    })
  })

  test('support changing deep wildcard', function(t) {
    t.plan(2)

    var e = builder({ wildcardSome: '*' })
      , expected = {
            topic: 'hello/my/world'
          , payload: { my: 'message' }
        }

    e.on('hello/*', function(message, cb) {
      t.equal(message.topic, 'hello/my/world')
      cb()
    })

    e.emit(expected, function() {
      e.close(function() {
        t.pass('closed')
      })
    })
  })

  test('support changing the level separator', function(t) {
    t.plan(2)

    var e = builder({ separator: '~' })
      , expected = {
            topic: 'hello~world'
          , payload: { my: 'message' }
        }

    e.on('hello~+', function(message, cb) {
      t.equal(message.topic, 'hello~world')
      cb()
    })

    e.emit(expected, function() {
      e.close(function() {
        t.pass('closed')
      })
    })
  })

  test('close support', function(t) {
    var e     = builder()
      , check = false

    t.notOk(e.closed, 'must have a false closed property')

    e.close(function() {
      t.ok(check, 'must delay the close callback')
      t.ok(e.closed, 'must have a true closed property')
      t.end()
    })

    check = true
  })

  test('emit after close errors', function(t) {
    var e = builder()

    e.close(function() {
      e.emit({ topic: 'hello' }, function(err) {
        t.ok(err, 'must return an error')
        t.end()
      })
    })
  })

  test('support multiple subscribers with wildcards', function(t) {
    var e = builder()
      , expected = {
            topic: 'hello/world'
          , payload: { my: 'message' }
        }
      , firstCalled = false
      , secondCalled = false

    e.on('hello/#', function(message, cb) {
      t.notOk(firstCalled, 'first subscriber must only be called once')
      firstCalled = true
      cb()
    })

    e.on('hello/+', function(message, cb) {
      t.notOk(secondCalled, 'second subscriber must only be called once')
      secondCalled = true
      cb()
    })

    e.emit(expected, function() {
      e.close(function() {
        t.end()
      })
    })
  })

  test('support multiple subscribers with wildcards (deep)', function(t) {
    var e = builder()
      , expected = {
            topic: 'hello/my/world'
          , payload: { my: 'message' }
        }
      , firstCalled = false
      , secondCalled = false

    e.on('hello/#', function(message, cb) {
      t.notOk(firstCalled, 'first subscriber must only be called once')
      firstCalled = true
      cb()
    })

    e.on('hello/+/world', function(message, cb) {
      t.notOk(secondCalled, 'second subscriber must only be called once')
      secondCalled = true
      cb()
    })

    e.emit(expected, function() {
      e.close(function() {
        t.end()
      })
    })
  })

}

module.exports = buildTests
