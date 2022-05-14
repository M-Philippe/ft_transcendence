import { useState } from 'react';
import { Socket } from 'socket.io-client';
import '../../../styles/chat.css';

/* Keep this in case of future compatibility problem */
//import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
/* Usual import */
import { DefaultEventsMap } from '@socket.io/component-emitter/index';
import { Action, State } from './chatConnected';

interface IChatInputProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
  state: State,
  dispatch: React.Dispatch<Action>,
  username: string,
}

export default function ChatInput(props: IChatInputProps) {
  const [text, setText] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.length === 0)
      return;
    props.socket.emit("postMessage", {id: props.state.chatFocusId +1, username: props.username, message: text});
    setText("");
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
    setText(event.target.value);
  }

  return (
      <form className="chatForm" onSubmit={(event) => {handleSubmit(event);}}>
        <input className="chatForm" value={text} onChange={(event) => {handleChange(event)}} />
      </form>
  );
}
