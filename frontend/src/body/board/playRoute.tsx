import { useState } from "react";
import { storeState } from "../../store/types";
import { connect } from 'react-redux';
import Board from './board';
import { Socket } from 'socket.io-client';
import { SocketHandler } from './socketHandler';
import SpectateGame from './spectateGame/spectateGame';
import pong from '../../styles/medias/ping-pong.png';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import NativeSelect from '@mui/material/NativeSelect';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';

interface rules {
  scoreMax: number,
  powerUp: boolean,
  map: string,
}

function PlayRoute(props: any) {

  const [inGame, setInGame] = useState(false);
  const [spectate, setSpectate] = useState(false);
  const [socket, setSocket] = useState<Socket>();
  const [rules, setRules] = useState<rules>({
    scoreMax: 3,
    powerUp: true,
    map: "original",
  });


const theme = createTheme({
  palette: {
    primary: {
      main: '#ffffff',
    },
  },
});


  if ((inGame || spectate) && socket === undefined)
    return(
      <div>
        <SocketHandler
          setSocket={setSocket}
          username={props.username}
        />
      </div>
    );
  else if (spectate && socket !== undefined) {
    return (
      <div>
        <SpectateGame
          socket={socket}
        />
      </div>
    );
  }
  else if (inGame && socket !== undefined) {
    socket.emit("createMatch", {
      username: props.username,
      scoreMax: rules.scoreMax,
      powerUp: rules.powerUp,
      map: rules.map,
    });
    return(
      <div>
        <Board
          socket={socket}
        />
      </div>
    );
  }
  else
    return (
      <div>
        <img id = "pongImgPlayMenu" src= {pong} alt="pong"></img>
        <Typography id="modal-modal-title" variant="h5" sx={{ textAlign: 'center', color:"white"}}>
        <br /><br /> Choose your game rules : <br/><br/>
        </Typography>
        <ThemeProvider theme={theme}>
        <Stack direction="row" sx={{ justifyContent:"center" }} spacing={7}>
        <FormControl >
        <InputLabel variant="standard" htmlFor="uncontrolled-native">
          Points
        </InputLabel>
        <NativeSelect color="primary" onChange={(event) => {setRules({...rules, scoreMax: parseInt(event.target.value)}); }}
          defaultValue={"3"}
          inputProps={{
            name: 'Points',
            id: 'uncontrolled-native',
          }} >
          <option value="3">3</option>
          <option value="5">5</option>
          <option value="7">7</option>
          </NativeSelect>
          </FormControl>
        <FormControl >
        <InputLabel variant="standard" htmlFor="uncontrolled-native">
          Power-Ups
        </InputLabel>
        <NativeSelect color="primary" onChange={(event) => {
          if (event.target.value === "yes")
          setRules({...rules, powerUp: true});
          else
          setRules({...rules, powerUp: false}); }}>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </NativeSelect>
        </FormControl>
        <FormControl >
        <InputLabel variant="standard" htmlFor="uncontrolled-native">
          Map
        </InputLabel>
        <NativeSelect color="primary" onChange={(event) => {
          setRules({...rules, map: event.target.value})
        }}>
          <option value="original">Original</option>
          <option value="desert">Desert</option>
          <option value="jungle">Jungle</option>
        </NativeSelect>
        </FormControl>
		  	</Stack>
        </ThemeProvider>
        <br /><br /><br />
        <Stack margin="auto" sx={{ width: '35%', }} spacing={2}>
        <Button color='success' variant="contained" onClick={() => setInGame(true)}>PLAY</Button>
        <Button variant="contained" onClick={() => setSpectate(true)}>SPECTATE</Button>
		  	</Stack>
      </div>
    );
}

function mapStateToProps(state: storeState, props: any) {
  return ({
    username: state.user.username,
    isConnected: state.user.isConnected,
  });
}

export default connect(mapStateToProps)(PlayRoute);
