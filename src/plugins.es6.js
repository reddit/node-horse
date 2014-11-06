// This file is another configuration-type file. We need to reference `import`
// statements directly so that browserify can find all of the plugins for
// client-side compilation.

import core from 'switcharoo-plugin-core';

var plugins = {
  core: core,
}

export default plugins;
