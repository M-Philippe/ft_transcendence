import { DefaultEventsMap } from '@socket.io/component-emitter/index';
import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';
import { BASE_API_URL } from '../../urlConstString';

interface ISocketHandler {
    setSocket: (input: Socket<DefaultEventsMap, DefaultEventsMap>) => void,
}

export default function SocketHandler(props: ISocketHandler) {
    useEffect(() => {
        const socket = io(BASE_API_URL, {
            path: "/user/userAlert",
            transports: ["websocket"],
            withCredentials: true,
            reconnection: false,
        });

        socket.on("connect", () => {
            props.setSocket(socket);
        });

        socket.on("reconnect", () => {
            props.setSocket(socket);
        });

        socket.on("connect_error", (error) => {
            console.log("ERROR_USER_ALERT_SOCKET: ", error);
        });
        props.setSocket(socket);
    });
    
    return (null);
}

