// This file is another configuration-type file. We need to reference `import`
// statements directly so that browserify can find all of the plugins for
// client-side compilation.

import core from 'switcharoo-plugin-core';
import metrics from 'switcharoo-plugin-metrics';

var plugins = {
  metrics: metrics,
  core: core,
}

export default plugins;
