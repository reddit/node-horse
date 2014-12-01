// set up oauth routes
var oauthRoutes = function(app, router) {
  var OAuth2 = require('simple-oauth2')({
    clientID: app.config.oauth.clientId,
    clientSecret: app.config.oauth.secret,
    site: app.config.nonAuthAPIOrigin,
    authorizationPath: '/api/v1/authorize.compact',
    tokenPath: '/api/v1/access_token',
  });

  var redirect = app.config.origin + '/oauth2/token';

  function saveToken(err, result, req, res) {
    var token;

    if (err) {
      res.redirect('/oauth2/error?message=' + encodeURIComponent(err.message));
    } else {
      token = OAuth2.accessToken.create(result);
      req.session.token = token.token;

      var options = {
        user: 'me', //the current oauth api doesn't return userid. :(
        headers: {
          Authorization: 'bearer ' + token.token.access_token,
        },
      }

      app.V1Api(req).users.get(options).done(function(user) {
        req.session.user = user;
        res.redirect(req.session.redirect || '/');
      });
    }
  }

  router.get('/login', function(req, res) {
    var redirectURI = OAuth2.authCode.authorizeURL({
      redirect_uri: redirect,
      scope: 'history,identity,mysubreddits,read,subscribe,vote,submit,save',
      state: req.csrfToken(),
    });

    req.session.redirect = req.get('Referer') || '/';

    res.redirect(redirectURI);
  });

  router.get('/oauth2/error', function(req, res) {
    res.send(req.query);
  });

  router.get('/oauth2/token', function(req, res) {
    var code = req.query.code;
    var error = req.query.error;

    if (error) {
      return res.redirect('/oauth2/error?message=' + req.query.error);
    }

    OAuth2.authCode.getToken({
      code: code,
      redirect_uri: redirect,
    }, function(err, result) {
      saveToken(err, result, req, res);
    });
  });
}

export default oauthRoutes;
