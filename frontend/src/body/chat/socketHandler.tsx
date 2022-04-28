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
    let pid: NodeJS.Timer;
    const socket = io(API_URL, {
      path: SOCKET_CHAT,
      withCredentials: true,
      reconnection: false,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      clearInterval(pid);
      // in case of restart server, needs to update socket manually in backend.
      //socket.emit("updateSocket", {
      //  username: props.username,
      //});
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
      //pid = setInterval(() =>{socket.connect();}, 10);
    });

    socket.on("connect_error", (error) => {
      console.log("Error Connect: ", error.message);
    });
    props.setSocket(socket);
  });

  return (
    <div></div>
  );
}
