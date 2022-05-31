import ChatLine from './chatLine';
import { State } from './chatConnected';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter/index';

interface Interx {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
  username: string,
  state: State,
}

export function ChatDisplay(props: Interx) {
  function displayLines() {
    const lines = [];
    for (let i = 0; i < props.state.messages.length; i++) {
      lines.push(
        <ChatLine
          socket={props.socket}
          id={props.state.chatFocusId +1}
          keyEvent={i}
          currentUsername={props.username}
          key={i}
          username={props.state.usernames[i]}
          timeMessage={props.state.timeMessages[i]}
          message={props.state.messages[i]}
      />);
    }
    return (lines);
  }

  return(
    <div>
        {displayLines()}
    </div>
  )
}
