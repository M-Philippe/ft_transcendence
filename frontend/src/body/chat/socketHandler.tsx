/* Keep this in case of future compatibility problem */
//import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
/* Usual import */
import { DefaultEventsMap } from '@socket.io/component-emitter/index';
import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';
import { API_URL, SOCKET_CHAT } from '../../urlConstString';

interface ISocketHandler {
  setSocket: (input: Socket<DefaultEventsMap, DefaultEventsMap>) => void,
  username: string,
}

export function SocketHandler(props: ISocketHandler) {
  useEffect(() => {
    const socket = io(API_URL, {
      path: "/chat/chatSocket",
      withCredentials: true,
      reconnection: false,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
    });

    socket.on("ERROR", (...args) => {
      switch (args[0].description) {
        case "No chat corresponding.":
          console.log("Error: ", args[0].description);
          break;
        case "Can't create: ":
          console.log("Error: ", args[0].description);
          console.log(args[0].errorMsg);
          break;
      }
    });

    socket.on("disconnect", () => {
    });

    socket.on("connect_error", (error) => {
    });
    props.setSocket(socket);
  });

  return (
    null
  );
}
