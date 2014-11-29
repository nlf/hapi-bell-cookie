var Hapi = require('hapi');
var Bell = require('bell');
var Cookie = require('hapi-auth-cookie');
var config = require('getconfig');

var server = new Hapi.Server();

var nav = '<nav><a href="/">Home</a> <a href="/session">Session</a> <a href="/hi">Hi</a> <a href="/login">Login</a></nav>'

server.connection({ 
    host: config.hostname, 
    port: config.port 
});

server.register([Bell, Cookie], function (err) {

    if (err) {
        throw err;
    }

    server.auth.strategy('twitter', 'bell', {
        provider: 'twitter',
        password: config.auth.password,
        isSecure: false,
        clientId: config.auth.twitter.clientID,
        clientSecret: config.auth.twitter.clientSecret
    });

    server.auth.strategy('session', 'cookie', {
        password: config.session.cookieOptions.password,
        cookie: 'sid',
        redirectTo: '/login',
        redirectOnTry: false,
        isSecure: false
    })

    server.route({
        method: ['GET', 'POST'],
        path: '/login',
        config: {
            auth: 'twitter',
            handler: function (request, reply) {
                request.auth.session.clear();
                request.auth.session.set(request.auth.credentials);

                return reply.redirect('/');

            }
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        config: {
            auth: {
                strategy: 'twitter',
                // mode: 'try'
            },
            handler: function (request, reply) {
                console.log(request.auth.isAuthenticated);
                if(request.auth.isAuthenticated) {
                    var profile = request.auth.credentials.profile
                    reply(nav + '<h1>Hello, ' + profile.displayName + '</h1>')
                }
                else {
                    reply(nav + '<h1>Hello</h1><p>You should <a href="/login">log in</a>.</p>')
                }
                // var profile = request.auth.credentials.profile
                // reply(nav + '<h1>Hello, ' + profile.displayName + '</h1>')
            }
        }
    });    

    server.route({
        method: 'GET',
        path: '/session',
        config: {
            auth: {
                strategy: 'twitter',
                // mode: 'try'  
            },
            handler: function (request, reply) {
                console.log(request.auth.isAuthenticated);
                if (request.auth.isAuthenticated) {
                    reply(nav + '<h1>Session</h1><pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>');
                }
                else {
                    reply(nav + '<h1>Session</h1>' + '<pre>' + JSON.stringify(request.auth.session, null, 4) + '</pre>' + '<p>You should <a href="/login">log in</a>.</p>')
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