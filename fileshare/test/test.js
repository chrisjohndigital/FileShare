var assert = require('assert');
var socketURL = 'http://localhost:8080';
var options ={
    transports: ['websocket'],
    'force new connection': true,
    'reconnection delay' : 0,
    'reopen delay' : 0
};
var express = require('express');
var io = require('socket.io-client');
var file='123456789';
var extension = '.txt';

describe('Fileshare asynchronous tests', function(){
    var socket;
    before(function(done) {
    // Setup
        console.log('Establishing socket.io connection');
        socket = io.connect(socketURL, options);
        socket.on('connect', function () {
            console.log ('Socket connection: ' + socket.connected);
            console.log ('Proceed to tests');
            done();
        });
        socket.on('connect_failed', function () {
            console.log ('Socket connection: ' + socket.connected);
        });
        socket.on('connect_error', function () {
            console.log ('Socket connection: ' + socket.connected);
        });
        socket.on('welcome', function (data) {
            var clients = data.clients;
            describe('Confirming connected number of clients', function() {
                it('should be not 0', function(done){
                    assert.notEqual(0, clients);
                    done();
                });
            });
             socket.emit('fileshare', file);
        });
        socket.on('fileshare', function (data) {
            var file = data;
            describe('Confirming file length', function() {
                it('should be not 0', function(done){
                    assert.notEqual(0, file.length);
                    done();
                });
            });
            socket.emit('fileshare-complete', '.txt');
        });
        socket.on('fileshare-complete', function (data) {
            describe('Confirming file share complete', function() {
                it('should be .txt', function(done){
                    assert.equal(extension, data);
                    done();
                });
            });
        });
    });
    describe('Confirming connection', function() {
        it('should be connected', function(){
            assert.equal(true, socket.connected);
        });
    });
})