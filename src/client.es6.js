import querystring from 'querystring';
import App from './app';

class ClientApp extends App {
  constructor (props = {}) {
    super(props);

    this.state = props.state || {};
  }

  // Server uses express sessions; on the client, we'll persist state in memory.
  getState (prop) {
    if (prop) {
      return this.state[prop];
    } else if (typeof prop === 'undefined') {
      return this.state;
    }
  }

  setState (prop, val) {
    this.state[prop] = val;
    return val;
  }

  resetState (state) {
    this.state = state || {};
  }

  buildRequest (url) {
    var splitUrl = url.split('?');
    var query = {};
    var url = url || '/';

    var pathName = this.fullPathName();

    if(splitUrl.length > 1) {
      url = splitUrl[0] || '/';
      query = querystring.parse(splitUrl[1] || '');
    }

    var req = {
      path: url,
      url: url,
      method: 'GET',
      renderSynchronous: false,
      useCache: true,
      query: query,
      headers: {
        referer: pathName,
      },
      //noop
      set: function(header, value) {
      }
    }

    return req;
  }

  fullPathName () {
    return document.location.pathname + document.location.search;
  }
}

module.exports = ClientApp;
