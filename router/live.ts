import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({
    port: 5010
});

const clients = new Map<string, WebSocket>();

wss.on('connection', (ws) => {
    const clientId = generateClientId(); // You need to implement this function
    clients.set(clientId, ws);

    ws.on('message', (message: string) => {
        console.log(`Received message from client ${clientId}: ${message}`);
    });

    ws.on('close', () => {
        console.log(`Client ${clientId} disconnected.`);
        clients.delete(clientId);
    });
});

const generateClientId = () => {
    return "111";
}

// beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta
// beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta
// beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta
// beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta
// beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta
// beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta
// beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta
// beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta beta