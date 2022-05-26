import '../../styles/index.css';
import '../../styles/chat.css';
import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { storeState } from '../../store/types';
import { connect } from 'react-redux';
/* Keep this in case of future compatibility problem */
//import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
/* Usual import */
import { DefaultEventsMap } from '@socket.io/component-emitter/index';
import { SocketHandler } from './socketHandler';
import { ChatConnected } from './chatConnected/chatConnected';
import { StyledEngineProvider } from '@mui/material';
import SelectInput from '@mui/material/Select/SelectInput';
import { selectedIdsLookupSelector } from '@mui/x-data-grid';

interface IChatProps {
  isConnected: boolean,
  username: string,
  inGame: boolean,
}

function Chat(props: IChatProps) {
  const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();

  if (!props.isConnected || props.inGame) {
    if (socket !== undefined) {
      if (socket.connected)
        socket.disconnect();
      setSocket(undefined);
    }
    return (null);
  }

  if (socket === undefined)
    return (
      <SocketHandler
        setSocket={setSocket}
        username={props.username}
      />
    );
  else
      return (
        <div id="chat">
        <ChatConnected
          name={props.username}
          socket={socket}
        />
        </div>
      );

  // if (props.isConnected && !props.inGame) {
  //   return (
	// 	<div id="chat">
  //       {socket === undefined &&

  //       }
  //       {socket !== undefined &&
  //           <ChatConnected
  //             name={props.username}
  //             socket={socket}
  //           />
  //       }
  //     </div>
  //     );
  // }
  // else {
  //   return (null);
  // }
}

function mapStateToProps(state: storeState, ownProps: any) {
  return ({
    username: state.user.username,
    isConnected: state.user.isConnected,
    inGame: state.user.isInGame,
  });
}

export default connect(mapStateToProps)(Chat);
