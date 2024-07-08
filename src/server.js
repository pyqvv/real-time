// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 연결된 클라이언트를 저장할 맵
const clients = new Map();

io.on('connection', (socket) => {
    console.log('New client connected: ' + socket.id);

    // 클라이언트가 Offer를 보내면 다른 클라이언트에게 전달
    socket.on('offer', (data) => {
        console.log('Received offer from client: ' + socket.id);
        const { offer, toClientId } = data;

        // toClientId에게 offer 전송
        const toClientSocket = clients.get(toClientId);
        if (toClientSocket) {
            toClientSocket.emit('offer', { offer, fromClientId: socket.id });
        }
    });

    // 클라이언트가 Answer를 보내면 다른 클라이언트에게 전달
    socket.on('answer', (data) => {
        console.log('Received answer from client: ' + socket.id);
        const { answer, toClientId } = data;

        // toClientId에게 answer 전송
        const toClientSocket = clients.get(toClientId);
        if (toClientSocket) {
            toClientSocket.emit('answer', { answer, fromClientId: socket.id });
        }
    });

    // ICE candidate을 다른 클라이언트에게 전달
    socket.on('ice-candidate', (data) => {
        console.log('Received ICE candidate from client: ' + socket.id);
        const { candidate, toClientId } = data;

        // toClientId에게 candidate 전송
        const toClientSocket = clients.get(toClientId);
        if (toClientSocket) {
            toClientSocket.emit('ice-candidate', { candidate, fromClientId: socket.id });
        }
    });

    // 클라이언트 연결 해제 시 처리
    socket.on('disconnect', () => {
        console.log('Client disconnected: ' + socket.id);
        clients.delete(socket.id);
    });

    // 클라이언트가 연결되면 클라이언트 맵에 추가
    clients.set(socket.id, socket);
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
