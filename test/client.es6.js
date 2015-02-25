require('6to5/register')({
  extensions: ['.js', '.es6.js']
});

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

var expect = chai.expect;

chai.use(sinonChai)

import ClientApp from '../src/client';
var render;

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

describe('ClientApp', function() {
  beforeEach(function() {
    render = sinon.spy();
  });

  it('is a thing', function() {
    expect(ClientApp).to.not.be.null;
  });

  describe('state', function() {
    it('can set default state', function() {
      var state = {
        data: 1,
      };

      var client = new ClientApp({
        state: state,
      });

      expect(client.state).to.equal(state);
    });

    it('can set new state', function() {
      var client = new ClientApp({
      });

      client.setState('a', 'b');
      expect(client.state['a']).to.equal('b');
    });

    it('gets state by string', function() {
      var state = { a: 'b' };

      var client = new ClientApp({
      });

      client.state = state;

      expect(client.getState('a')).to.equal('b');
    });

    it('can return entire state', function() {
      var state = { a: 'b' };

      var client = new ClientApp({
      });

      client.state = state;

      expect(client.getState()).to.equal(state);
    });
  });

  describe('router', function() {
    var ctx, client;

    beforeEach(function() {
      client = new ClientApp();
      client.fullPathName = function() { return ''; }

      ctx = buildCtx('/');
    });

    it('can error gracefully', function() {
      sinon.stub(client, 'error');

      client.router.get('/', function(req, res, next) {
        throw 'EVERTHING IS WRONG';
      });

      client.route(ctx);

      expect(client.error).to.have.been.calledOnce;
    });

    it('can redirect to /404 on 404s', function(done) {
      client.route(ctx, function() {
        expect(ctx.redirect).to.have.been.calledOnce;
        expect(ctx.redirect).to.have.been.calledWith(404, '/404');
        done();
      });
    });
  });
});
