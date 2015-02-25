require('6to5/register')({
  extensions: ['.js', '.es6.js']
});

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

var expect = chai.expect;

chai.use(sinonChai)

import App from '../src/app';

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
      var app = new App();
      var spy = sinon.spy();

      var route = function *() {
        console.log('is a thing');
        spy();
      }

      var path = '/';

      app.router.get(path, route);

      app.route(buildCtx(path), function() {
        expect(spy).to.have.been.calledOnce;
        done();
      });
    });

    it('plays nice with async', function(done) {
      var app = new App();
      var ctx = buildCtx(path);

      var route = function *(next) {
        yield setTimeout(next, 1000);
        this.a = 'b';
      }

      var path = '/';

      app.router.get(path, route);

      app.route(buildCtx(path), function() {
        expect(this.a).to.equal('b');
        done();
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
