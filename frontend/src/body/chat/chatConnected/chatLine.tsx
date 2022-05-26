import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack';
import { useState } from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { NavLink } from "react-router-dom";
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter/index';

interface IChatLineProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
  id: number,
  keyEvent: number,
  currentUsername: string,
  key: number,
  username: string,
  timeMessage: string,
  message: string,
}

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

  // const [avatar, setAvatar] = useState("");

  // props.socket.off("receivedAvatar" + props.keyEvent);
  // props.socket.on("receivedAvatar" + props.keyEvent, (...args: any) => {
  //   setAvatar(args[0].avatar);
  // })

  // props.socket.emit("getAvatar", { username: props.username, key: props.keyEvent});

  // Add decimal when seconde < 10 (avoid decalage in chat and prettier)
  var output = props.timeMessage;
  if(props.timeMessage.length === 6)
  {
    var position = 5;
    output = [props.timeMessage.slice(0, position), "0", props.timeMessage.slice(position)].join('');
  }
  // ---------------------------------------------

  return (
        <div>
        <Stack direction="row" sx={{ justifyContent:"center", display: 'flex', alignItems: 'center', flexWrap: 'wrap' }} spacing={1}>
          {/* <Avatar onClick={handleOpenNavMenu} alt="avatar" src={avatar} /> */}
				<Menu id="menu-appbar" anchorEl={anchorElNav} anchorOrigin={{vertical: 'bottom', horizontal: 'left', }}	
					keepMounted transformOrigin={{vertical: 'top', horizontal: 'left', }} open={Boolean(anchorElNav)} onClose={handleCloseNavMenu}>
          <MenuItem onClick={handleCloseNavMenu} component={NavLink} to={pathLink}>Profile</MenuItem>
          {props.username !== props.currentUsername && <MenuItem onClick={handleInviteGame}>Invite to play</MenuItem>}
				</Menu>
          <button onClick={handleOpenNavMenu} style={{display:"inline", textDecoration:"none"}}>{props.username} </button>
        <p>
        - {output}
        </p>
        </Stack>
        <p>
        {props.message}
      </p>
      </div>
  );
}
