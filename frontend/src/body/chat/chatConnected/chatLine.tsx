import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack';
import { useState, useEffect } from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { NavLink } from "react-router-dom";
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter/index';
import { Action, State } from './chatConnected';
// import { buttons } from './displayButtonsChat';

interface IChatLineProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
  id: number,
  keyEvent: number,
  currentUsername: string,
  key: number,
  username: string,
  timeMessage: string,
  message: string,
  dispatch: React.Dispatch<Action>,
  state: State,
}
  
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  
export default function ChatLine(props: IChatLineProps) {

  let pathLink = "/userView/:" + props.username;

  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleInviteGame = () => {
    setAnchorElNav(null);
    props.socket.emit("postMessage", {id: props.id, username: null, message: "/gameOptions " + props.username});
  };

  async function handlePrivateMsg() {
    setAnchorElNav(null);
    props.socket.emit("postMessage", {id: props.id, username: null, message: "/mp " + props.username});
    
    await sleep(300);

    let i = props.state.lstId.length - 2;
    props.dispatch({
      type: "UPDATE_FOCUS_AND_REMOVE_GREEN",
      chatFocusId: props.state.lstId[i].id,
      lstButtonsGreen: props.state.lstButtonsGreen,});
      
      // var elem = document.getElementById('NewPMbutton');
      // if (elem !== null)
      // {
      //   elem.style.margin = "3px";
      //   elem.style.borderRadius = "10px";
      //   elem.style.border = "1px solid darkblue";
      //   elem.style.backgroundColor = "rgb(25, 118, 210)";
      // }
  };

  const [avatar, setAvatar] = useState("");

  props.socket.off("receivedAvatar" + props.keyEvent);
  props.socket.on("receivedAvatar" + props.keyEvent, (...args: any) => {
    setAvatar(args[0].avatar);
  })

  props.socket.emit("getAvatar", { username: props.username, key: props.keyEvent});

  return (
        <div>
        <Stack direction="row" sx={{ justifyContent:"center", display: 'flex', alignItems: 'center', flexWrap: 'wrap' }} spacing={1}>
          <Avatar onClick={handleOpenNavMenu} alt="avatar" src={avatar} />
				<Menu id="menu-appbar" anchorEl={anchorElNav} anchorOrigin={{vertical: 'bottom', horizontal: 'left', }}	
					keepMounted transformOrigin={{vertical: 'top', horizontal: 'left', }} open={Boolean(anchorElNav)} onClose={handleCloseNavMenu}>
          <MenuItem onClick={handleCloseNavMenu} component={NavLink} to={pathLink}>Profile</MenuItem>
          {props.username !== props.currentUsername && <MenuItem onClick={handlePrivateMsg}>Private message</MenuItem>}
          {props.username !== props.currentUsername && <MenuItem onClick={handleInviteGame}>Invite to play</MenuItem>}
				</Menu>
          <button onClick={handleOpenNavMenu} style={{display:"inline", textDecoration:"none"}}>{props.username} </button>
        <p>
        - {props.timeMessage}
        </p>
        </Stack>
        <p style={{borderBottom:"1px solid rgba(0, 0, 0, 0.30)"}}>
        {props.message}<br/><br/>
      </p>
      </div>
  );
}
