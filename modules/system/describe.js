#!/usr/bin/env node
'use strict';

// Export a no-op describe function so requiring this module has no side effects.
function describeNoop() {
  // intentional no-op placeholder
  return 'describe: no-op placeholder';
}

module.exports = describeNoop;

// When executed directly as a CLI, print the message.
if (require.main === module) {
  console.log(describeNoop());
}
