// This file is another configuration-type file. We need to reference `import`
// statements directly so that browserify can find all of the plugins for
// client-side compilation.

import core from 'switcharoo-plugin-core';
import metrics from 'switcharoo-plugin-metrics';
import ads from 'switcharoo-plugin-ads';

var plugins = {
  ads: ads,
  metrics: metrics,
  core: core,
}

export default plugins;
