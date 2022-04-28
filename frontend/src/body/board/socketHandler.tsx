/* Keep this in case of future compatibility problem */
//import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
/* Usual import */
import { DefaultEventsMap } from '@socket.io/component-emitter/index';
import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';
import { SOCKET_MATCHESONGOING } from '../../urlConstString';

interface ISocketHandler {
  setSocket: (input: Socket<DefaultEventsMap, DefaultEventsMap>) => void,
  username: string,
}

export function SocketHandler(props: ISocketHandler) {

  useEffect(() => {
    const socket = io("localhost:3000", {
      path: SOCKET_MATCHESONGOING,
      transports: ["websocket"],
      withCredentials: true,
      reconnection: false
    });

    socket.on("connect", () => {
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
