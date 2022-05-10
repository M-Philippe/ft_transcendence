import ChatLine from './chatLine';
import { Action, State } from './chatConnected';

interface Interx {
  state: State,
  dispatch: React.Dispatch<Action>,
}

export function ChatDisplay(props: Interx) {
  function displayLines() {
    const lines = [];
    for (let i = 0; i < props.state.messages.length; i++) {
      lines.push(
        <ChatLine
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