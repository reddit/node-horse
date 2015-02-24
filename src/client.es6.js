import querystring from 'querystring';
import App from '../app';

// Get the current location.
function fullPathName () {
  return document.location.pathname + document.location.search;
}

class ClientApp extends App {
  constructor (props) {
    super(props);

    if (props.render) {
      this.render = props.render.bind(this);
    }
  }

  get res () {
    return {
      render: this.render,
      error: this.error,
      redirect: this.redirect,
    }
  }

  // Server uses express sessions; on the client, we'll persist state in memory.
  getState (prop) {
    if (prop) {
      return this.state[prop];
    }

    return this.state;
  }

  setState (prop, val) {
    this.state[prop] = val;
    return v;
  }

  resetState (state) {
    this.state = state || {};
  }

  render (res) {
    console.log(res);
  }

  error (clientResponse, req, res, app) {
    var status = clientResponse.status || 500;
    var message = clientResponse.message || 'Unkown error';

    var error = clientResponse.error;

    var reroute = '/' + status;

    if (req.url !== reroute) {
      req.status = status;
      req.url = '/' + status;

      return app.route(req, res);
    } else {
      console.log(clientResponse);
    }
  }

  redirect () {
    this.changeUrl(path);
  }

  request (req) {
    var splitUrl = url.split('?');
    var query = {};
    var url = url || '/';

    if(splitUrl.length > 1) {
      url = splitUrl[0] || '/';
      query = querystring.parse(splitUrl[1] || '');
    }

    var req = {
      url: url,
      method: 'GET',
      renderSynchronous: false,
      useCache: true,
      query: query,
      headers: {
        referer: fullPathName(),
      },
      session: app.getState('session') || {},
    }

    return req;
  }

  changeUrl (path, initial, referrer) {
    var req = buildRequest(href, app);
    req.headers.referer = referrer || req.headers.referer;

    if (initial) {
      req.props = this.getState()
    }

    app.route(req, this.res);
  }
}

module.exports = ClientApp;
