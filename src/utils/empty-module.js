/**
 * Empty module stub — returned by Metro for native-only packages on web.
 * Exports a Proxy so any property access returns a no-op function,
 * preventing "X is not a function" errors at runtime.
 */
const handler = {
  get(_target, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return noop;
    return noop;
  },
};

function noop() {
  return noop;
}

// Make noop itself callable + chainable
noop.wrap = (c) => c;
noop.init = noop;
noop.captureException = noop;
noop.setNotificationHandler = noop;

module.exports = new Proxy(noop, handler);
