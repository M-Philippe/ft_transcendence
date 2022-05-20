/* Keep this in case of future compatibility problem */
//import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
/* Usual import */
import { DefaultEventsMap } from '@socket.io/component-emitter/index';
import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';
import { BASE_API_URL, SOCKET_MATCHESONGOING } from '../../urlConstString';

interface ISocketHandler {
  setSocket: (input: Socket<DefaultEventsMap, DefaultEventsMap>) => void,
  username: string,
}

export function SocketHandler(props: ISocketHandler) {

  useEffect(() => {
    const socket = io(BASE_API_URL, {
      path: "/matchesOnGoing",
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
    null
  );
}
