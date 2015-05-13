/**
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var pg = require('pg'),
  model = module.exports,
  connString = process.env.DATABASE_URL;

/*
 * Required
 */

model.getAccessToken = function (bearerToken, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
    client.query('SELECT access_token, client_id, expires, user_id FROM oauth_access_tokens ' +
        'WHERE access_token = $1', [bearerToken], function (err, result) {
      if (err || !result.rowCount) return callback(err);
      // This object will be exposed in req.oauth.token
      // The user_id field will be exposed in req.user (req.user = { id: "..." }) however if
      // an explicit user object is included (token.user, must include id) it will be exposed
      // in req.user instead
      var token = result.rows[0];
      model.getUserDetails(null, token.user_id, function(err, user){
        if (err || !user) return callback(err);
        callback(null, {
          accessToken: token.access_token,
          clientId: token.client_id,
          expires: token.expires,
          userId: token.user_id,
          user: user
        });
        done();
      });
    });
  });
};

model.getClient = function (clientId, clientSecret, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);

    client.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE ' +
      'client_id = $1', [clientId], function (err, result) {
      if (err || !result.rowCount) return callback(err);

      var client = result.rows[0];

      if (clientSecret !== null && client.client_secret !== clientSecret) return callback();

      // This object will be exposed in req.oauth.client
      callback(null, {
        clientId: client.client_id,
        clientSecret: client.client_secret
      });
      done();
    });
  });
};

model.getRefreshToken = function (bearerToken, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
    client.query('SELECT refresh_token, client_id, expires, user_id FROM oauth_refresh_tokens ' +
        'WHERE refresh_token = $1', [bearerToken], function (err, result) {
      // The returned user_id will be exposed in req.user.id
      callback(err, result.rowCount ? result.rows[0] : false);
      done();
    });
  });
};

// This will very much depend on your setup. This example assumes the grant_types are stored in the database with the client.
model.grantTypeAllowed = function (clientId, grantType, callback) {
  pg.connect(connString, function(err, client, done) {
    if (err) return callback(err);
    client.query('SELECT client_id FROM oauth_clients ' + 'WHERE client_id = $1 AND grant_type = $2', [clientId, grantType],
      function(err, result) {
        if (err) return callback(err);
        callback(false, result.rowCount ? true : false);
        done();
      });
  });
};

model.saveAccessToken = function (accessToken, clientId, expires, user, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
    client.query('INSERT INTO oauth_access_tokens(access_token, client_id, user_id, expires) ' +
        'VALUES ($1, $2, $3, $4)', [accessToken, clientId, user.id, expires],
        function (err, result) {
      callback(err);
      done();
    });
  });
};

model.saveRefreshToken = function (refreshToken, clientId, expires, user, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
    client.query('INSERT INTO oauth_refresh_tokens(refresh_token, client_id, user_id, ' +
        'expires) VALUES ($1, $2, $3, $4)', [refreshToken, clientId, user.id, expires],
        function (err, result) {
      callback(err);
      done();
    });
  });
};

/*
 * Required to support password grant type
 */
model.getUser = function (username, password, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
    client.query('SELECT id FROM users WHERE username = $1 AND password = $2', [username,
        password], function (err, result) {
      callback(err, result.rowCount ? result.rows[0] : false);
      done();
    });
  });
};

/*
 * Required to return user details
 */
model.getUserDetails = function (identifier, uuid, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
    var query = 'SELECT * FROM users WHERE username = $1';
    if (uuid) {
       query = 'SELECT * FROM users WHERE id = $1';
       identifier = uuid;
    }
    client.query(query, [identifier], function (err, result) {
      if (result && result.rows && result.rows.length && result.rows[0]) {
        result = result.rows[0];
        delete result.password;
      } else {
        result = false;
      }
      callback(err, result);
      done();
    });
  });
};
