import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

var expect = chai.expect;

chai.use(sinonChai)

import {App} from '../index';

function buildCtx (path, data) {
  var request = {
    path: path,
    method: 'GET',
  };

  return {
    request,
    path: request.path,
    method: request.method,
    redirect: sinon.spy(),
    set: sinon.spy(),
  };
}

describe('App', function() {
  it('is a thing', function() {
    expect(App).to.not.be.null;
  });

  it('has config', function() {
    var config = {
      test: 1,
    };

    var app = new App(config);
    expect(app.getConfig('test')).to.equal(config.test);
  });

  describe('router', function() {
    it('is created on construction', function() {
      var app = new App();
      expect(app.router).to.not.be.null;
    });

    it('calls routes', function(done) {
      var path = '/';

      var app = new App();
      var spy = sinon.spy();
      var ctx = buildCtx(path);

      var route = function * (next) {
        spy();
      }

      app.router.get(path, route);

      app.route(ctx).then(function() {
        expect(spy).to.have.been.calledOnce;
        done();
      });
    });

    it('plays nice with async', function(done) {
      var path = '/';

      var app = new App();
      var ctx = buildCtx(path);

      function get (data, cb) {
        setTimeout(function() {
          cb(data);
        }, 500);
      }

      function wrappedGet(data, ctx) {
        return new Promise(function(resolve) {
          get(data, resolve);
        });
      }

      var route = function * (next) {
        var data = yield wrappedGet('b');
        this.a = data;
      };

      app.router.get(path, route);

      app.route(ctx).then(function() {
        expect(ctx.a).to.equal('b');
        done();
      });
    });

    it('can error gracefully', function() {
      var app = new App();
      var ctx = buildCtx('/');

      sinon.stub(app, 'error');

      app.router.get('/', function(req, res, next) {
        throw 'EVERTHING IS WRONG';
      });

      app.route(ctx).then(function() {
        expect(app.error).to.have.been.calledOnce;
      });
    });
  });

  describe('event emitter', function() {
    it('is created on construction', function() {
      var app = new App();
      expect(app.emitter).to.not.be.null;
    });
  });

  describe('plugins', function() {
    it('registers plugins once', function() {
      var app = new App();
      var plugin = function() { };

      app.registerPlugin(plugin);
      app.registerPlugin(plugin);

      expect(app.plugins.length).to.equal(1);
      expect(app.plugins[0]).to.equal(plugin);
    });
  });
});
