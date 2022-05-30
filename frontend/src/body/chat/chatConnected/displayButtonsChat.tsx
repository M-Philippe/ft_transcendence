import { Action, State } from './chatConnected';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

interface Props {
  state: State,
  dispatch: React.Dispatch<Action>,
}

export default function DisplayButtonsChat(props: Props) {

  function  displayButtons() {
    const buttons = [];
    for (let i = 0; i < props.state.lstId.length; i++) {
      if (props.state.lstButtonsGreen.indexOf(props.state.lstId[i].id) >= 0) {
        buttons.push(
          <Button variant="contained" key={i}
            style={{margin:"3px", borderRadius:"10px", backgroundColor:"rgb(8, 133, 25)", color: "black", fontWeight: props.state.lstId[i].id === 1 ? "bold" : "lighter" }}
            onClick={() => {
              props.state.lstButtonsGreen.splice(props.state.lstButtonsGreen.indexOf(props.state.lstId[i].id), 1)
              props.dispatch({
                type: "UPDATE_FOCUS_AND_REMOVE_GREEN",
                chatFocusId: props.state.lstId[i].id - 1,
                lstButtonsGreen: props.state.lstButtonsGreen,
              });
            }}>
            {props.state.lstId[i].id === 1 ? "General" : props.state.lstId[i].name}
          </Button>);
      } else if (props.state.lstId[i].id === props.state.chatFocusId + 1) {
        buttons.push(
          <Button variant="contained" key={i}
            style={{margin:"3px",borderRadius:"10px", border: "1px solid darkblue", color: "black", fontWeight: props.state.lstId[i].id === 1 ? "bold" : "lighter" }}
            onClick={() => {
            props.dispatch({type: "UPDATE_FOCUS", chatFocusId: props.state.lstId[i].id - 1});
            }}>
            {props.state.lstId[i].id === 1 ? "General" : props.state.lstId[i].name}
          </Button>);
  } else {
        buttons.push(
          <Button variant="contained" key={i}
            style={{margin:"3px", borderRadius:"10px" , backgroundColor: "rgb(27, 120, 150)", color: "black", fontWeight: props.state.lstId[i].id === 1 ? "bold" : "lighter" }}
            onClick={() => {
              props.dispatch({type: "UPDATE_FOCUS", chatFocusId: props.state.lstId[i].id - 1});
            }}>
            {props.state.lstId[i].id === 1 ? "General" : props.state.lstId[i].name}
          </Button>);
      }
  }
  return (buttons);
}

  return (
  <Grid 
    justifyContent="flex-start"
    alignItems="flex-start" 
  >
  {displayButtons()}
  </Grid>
  );
}
