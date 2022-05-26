/* Keep this in case of future compatibility problem */
//import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
/* Usual import */
import { DefaultEventsMap } from '@socket.io/component-emitter/index';
import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';
import { API_URL, BASE_API_URL, SOCKET_CHAT } from '../../urlConstString';

interface ISocketHandler {
  setSocket: (input: Socket<DefaultEventsMap, DefaultEventsMap>) => void,
  username: string,
}

export function SocketHandler(props: ISocketHandler) {
  useEffect(() => {
    const socket = io(BASE_API_URL, {
      path: "/chat/chatSocket",
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
    });
    socket.connect();

    socket.on("connect", () => {
      props.setSocket(socket);
    });

    socket.on("disconnect", () => {
      socket.connect();
    });

    socket.on("connect_error", (error) => {
      console.log("ERROR_SOCKET: ", error);
    });
    props.setSocket(socket);
  });

  return (
    null
  );
}
