import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack';
import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { NavLink } from "react-router-dom";
// import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter/index';

interface IChatLineProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
  id: number,
  currentUsername: string,
  key: number,
  username: string,
  timeMessage: string,
  message: string,
  avatar: string,
}

export default function ChatLine(props: IChatLineProps) {
  let pathLink = "/userView/:" + props.username;

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);

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
          <Avatar onClick={handleOpenNavMenu} sx={{width: 24, height: 24 }} alt="avatar" src={props.avatar} />
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
