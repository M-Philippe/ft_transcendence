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
  const [timer, setTimer] = useState(Date.now());

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.length === 0 || Date.now() - timer < 400)
      return;
    if (text.length > 250)
      return(alert("Too long message (max 250 characters)."));

    setTimer(Date.now());
    props.socket.emit("postMessage", {id: props.state.chatFocusId +1, username: props.username, message: text});
    setText("");
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
    setText(event.target.value);
  }

  return (
      <form onSubmit={(event) => {handleSubmit(event);}}>
          <input autoFocus className="chatForm" type="text" placeholder=' Type your message' value={text} onChange={(event) => {handleChange(event)}} />
      </form>
  );
}
