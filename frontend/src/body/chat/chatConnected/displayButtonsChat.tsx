import { Action, State } from './chatConnected';

interface Props {
  state: State,
  dispatch: React.Dispatch<Action>,
}

export default function DisplayButtonsChat(props: Props) {

  function  displayButtons() {
    const buttons = [];
    for (let i = 0; i < props.state.lstId.length; i++) {
      if (props.state.lstButtonsGreen.indexOf(props.state.lstId[i]) >= 0) {
        buttons.push(
          <button key={i}
            style={{backgroundColor:"green", color: props.state.lstId[i] === 1 ? "black": "green" }}
            onClick={() => {
              props.state.lstButtonsGreen.splice(props.state.lstButtonsGreen.indexOf(props.state.lstId[i]), 1)
              props.dispatch({
                type: "UPDATE_FOCUS_AND_REMOVE_GREEN",
                chatFocusId: props.state.lstId[i] - 1,
                lstButtonsGreen: props.state.lstButtonsGreen,
              });
            }}>
            {props.state.lstId[i] === 1 ? "General" : "X"}
          </button>);
      } else if (props.state.lstId[i] === props.state.chatFocusId + 1) {
        buttons.push(
          <button key={i}
            style={{ backgroundColor:"red", color: props.state.lstId[i] === 1 ? "black" : "red" }}
            onClick={() => {
            props.dispatch({type: "UPDATE_FOCUS", chatFocusId: props.state.lstId[i] - 1});
            }}>
            {props.state.lstId[i] === 1 ? "General" : "X"}
          </button>);
  } else {
        buttons.push(
          <button key={i}
            style={{ backgroundColor: "grey", color: props.state.lstId[i] === 1 ? "black" : "grey" }}
            onClick={() => {
              props.dispatch({type: "UPDATE_FOCUS", chatFocusId: props.state.lstId[i] - 1});
            }}>
            {props.state.lstId[i] === 1 ? "General" : "X"}
          </button>);
      }
  }
  return (buttons);
}

  return (
    <div>
      {displayButtons()}
    </div>
  );
}
