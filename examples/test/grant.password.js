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

var express = require('express'),
  bodyParser = require('body-parser'),
  request = require('supertest'),
  should = require('should');

var app = require('./../postgresql/index').app;

describe('Granting with password grant type', function () {
  it('should detect missing parameters', function (done) {

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        client_id: 'afancyagregatorapp',
        client_secret: 'a-top-secret-key'
      })
      .expect(400, /missing parameters. \\"username\\" and \\"password\\"/i, done);

  });

  it('should detect a valid user', function (done) {

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        client_id: 'afancyagregatorapp',
        client_secret: 'a-top-secret-key',
        username: 'thom',
        password: 'nightW0r1d'
      })
      .expect(200, /"token_type":"bearer","access_token"/i, done);

  });

  it('should detect invalid user', function (done) {

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        client_id: 'afancyagregatorapp',
        client_secret: 'a-top-secret-key',
        username: 'notauser',
        password: 'nightW0r1d'
      })
      .expect(400, /user credentials are invalid/i, done);

  });
});
