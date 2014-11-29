var Hapi = require('hapi');
var Bell = require('bell');
var Cookie = require('hapi-auth-cookie');
var Yar = require('yar');
var config = require('getconfig');

var server = new Hapi.Server();

var nav = '<nav><a href="/">Home</a> <a href="/session">Session</a> <a href="/hi">Hi</a> <a href="/login">Login</a></nav>'

server.connection({ 
    host: config.hostname, 
    port: config.port 
});

server.register([Bell, { register: Yar, options: config.session } ], function (err) {

    if (err) {
        throw err;
    }

    server.auth.strategy('twitter', 'bell', {
        provider: 'twitter',
        password: config.auth.twitter.password,
        isSecure: false,
        clientId: config.auth.twitter.clientId,
        clientSecret: config.auth.twitter.clientSecret
    });

    server.route({
        method: ['GET', 'POST'],
        path: '/login',
        config: {
            auth: 'twitter',
            handler: function (request, reply) {
                console.log('session', JSON.stringify(request.session, null, 2));
                return reply.redirect('/');

            }
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        config: {
            handler: function (request, reply) {
                // console.log('session', request.session);
                if(request.session.user) {
                    var profile = request.session.user.profile
                    reply(nav + '<h1>Hello, ' + profile.displayName + '</h1>')
                }
                else {
                    reply(nav + '<h1>Hello</h1><p>You should <a href="/login">log in</a>.</p>')
                }
            }
        }
    });    

    server.route({
        method: 'GET',
        path: '/session',
        config: {
            auth: 'twitter',
            handler: function (request, reply) {
                // console.log(request.session);
                if (request.session) {
                    reply(nav + '<h1>Session</h1><pre>' + JSON.stringify(request.session, null, 4) + '</pre>');
                }
                else {
                    reply(nav + '<h1>Session</h1>' + '<pre>' + JSON.stringify(request.session, null, 4) + '</pre>' + '<p>You should <a href="/login">log in</a>.</p>')
                }
                
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/hi',
        config: {
            auth: false,
            handler: function (request, reply) {
                reply(nav + '<h1>Hi, no auth required here</h1>')
            }
        }
    });

    server.start(function (err) {
        console.log('Server started at:', server.info.uri);
    });
});