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

interface IChatProps {
  isConnected: boolean,
  username: string,
  inGame: boolean,
}

function Chat(props: IChatProps) {
  const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();

  if (!props.isConnected)
    return (<div></div>);

  if (socket !== undefined && !props.isConnected) {
    socket.disconnect();
    setSocket(undefined);
  }

  if (props.isConnected && !props.inGame) {
    return (
      <div id="chat">
        {socket === undefined &&
          <SocketHandler
            setSocket={setSocket}
            username={props.username}
          />
        }
        {socket !== undefined &&
          <div style={{overflow: "scroll"}} className="tstWrap">
            <ChatConnected
              name={props.username}
              socket={socket}
            />
          </div>
        }
      </div>);
  }
  else {
    return (<div></div>);
  }
}

function mapStateToProps(state: storeState, ownProps: any) {
  return ({
    username: state.user.username,
    isConnected: state.user.isConnected,
    inGame: state.user.isInGame,
  });
}

export default connect(mapStateToProps)(Chat);
