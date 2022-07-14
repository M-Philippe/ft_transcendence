import SocketHandler from "./SocketHandler";
import UserAlert from "./userAlert";
import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter/index';

export default function UserAlertBundle(props: any) {
    const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();

    if (socket === undefined)
        return (
            <SocketHandler setSocket={setSocket} />
        );
    else
        return(
            <UserAlert socket={socket} />
        );
}