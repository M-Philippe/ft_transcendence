import { NavLink } from "react-router-dom";
import LoginInfos from './loginInfos/loginInfos';
import { connect } from 'react-redux';
import { DispatchType, storeState } from '../store/types';
import { userState } from '../store/userSlice/userSliceTypes';
import UserAlert from "./userAlert/userAlert";
// import { DISCONNECTING_URL } from '../urlConstString';
// import { useState } from 'react';
// import { DISCONNECT_USER } from '../store/userSlice/userSliceActionTypes';
// import SearchBar from './searchBar/searchBar';
// import store from "../store/store";

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

interface IProps {
	user: userState;
	dispatch: DispatchType;
  }

  const linksNotLog = [
	{
		to: '/ranking',
		name: 'Ranking'
	},
	{
		to: '/login',
		name: 'Login'
	},
	{
		to: '/register',
		name: 'Register'
	}
]

const linksLoged = [
	{
		to: '/ranking',
		name: 'Ranking'
	},
	{
		to: '/listChat',
		name: 'Chat List'
	},
	{
		to: '/play',
		name: 'Play'
	},
	{
		to: '/myProfile',
		name: 'Profile'
	}
]

const userMenu = [
	{
		to: '/myProfile',
		name: 'Profile'
	},
	{
		to: '/disconnect',
		name: 'Disconnect'
	}
]

const Header = (props: IProps) => {
	// const [redirectDisconnect, setRedirectDisconnect] = useState(false);

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

	let linkToDisplay;
	if (!props.user.isConnected)
		linkToDisplay = linksNotLog;
	else
		linkToDisplay = linksLoged;


//   if (redirectDisconnect) {
// 	window.location.assign(DISCONNECTING_URL);
// 	return (<p>LEAVING SITE</p>);
// 	} 
// 	else {
	return (
		<AppBar id ="navBar" position="static">
		<Container maxWidth={false}>
			<Toolbar disableGutters>
			{/* <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} /> */}
			<Typography variant="h6" noWrap component={NavLink}	to="/"	sx={{mr: 2, display: { xs: 'none', md: 'flex' }, 
				fontFamily: 'monospace', fontWeight: 700, color: 'inherit', textDecoration: 'none', }}	>
					Ft_transcendence
			</Typography>

			{ props.user.isConnected && <UserAlert /> }

			<Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
				<IconButton	size="large" aria-label="account of current user" aria-controls="menu-appbar" 
					aria-haspopup="true" onClick={handleOpenNavMenu} color="inherit">
				<MenuIcon />
				</IconButton>
				<Menu id="menu-appbar"	anchorEl={anchorElNav}	anchorOrigin={{	vertical: 'bottom', horizontal: 'left',	}}	
					keepMounted transformOrigin={{vertical: 'top', horizontal: 'left', }} open={Boolean(anchorElNav)} onClose={handleCloseNavMenu}	
						sx={{display: { xs: 'block', md: 'none' }, }}>
				{linkToDisplay.map(link => (
						<MenuItem key={link.name} onClick={handleCloseNavMenu} component={NavLink} to={link.to}>{link.name}</MenuItem>
				))}
				</Menu>

			</Box>
			<Typography	variant="h5" noWrap component={NavLink}	to="/" sx={{mr: 2, display: { xs: 'flex', md: 'none' },	flexGrow: 1, 
				fontFamily: 'monospace', fontWeight: 700, fontSize:20, color: 'inherit',	textDecoration: 'none',	}} >
				Ft_transcendence
			</Typography>

			<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
			{linkToDisplay.map(link => (
			<Typography variant="h6" noWrap	sx={{mr: 2, display: { xs: 'none', md: 'flex' }, 
				fontFamily: 'monospace', color: 'inherit', textDecoration: 'none',}}	>
				<MenuItem  className="ButtonLinkNavbar" key={link.name} onClick={handleCloseNavMenu} component={NavLink} to={link.to}>{link.name}</MenuItem>
			</Typography>
			))}

			</Box>

			<Typography
				variant="h6" noWrap component={NavLink}	to="/myProfile"	
					sx={{mr: 2,	display: { xs: 'none', md: 'flex' }, fontFamily: 'monospace', fontWeight: 700, color: 'inherit', textDecoration: 'none', }}	>
			{ props.user.username }
			</Typography>

			<Box sx={{ flexGrow: 0 }}>
				<IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
				<LoginInfos />
				</IconButton>
				<Menu sx={{ mt: '45px' }} id="menu-appbar" anchorEl={anchorElUser} 
					anchorOrigin={{vertical: 'top', horizontal: 'right',	}} 
						keepMounted transformOrigin={{vertical: 'top', horizontal: 'right', }} open={Boolean(anchorElUser)} onClose={handleCloseUserMenu} >
					{userMenu.map(link => (
						<MenuItem key={link.name} onClick={handleCloseUserMenu}component={NavLink} to={link.to}>{link.name}</MenuItem>
					))}
				</Menu>
			</Box>
			{props.user.isConnected && 
			<IconButton aria-label="delete" color="error"  size="large" component={NavLink} to='/disconnect'>
			<ExitToAppIcon fontSize="large"/>
		  	</IconButton>}
			</Toolbar>
		</Container>
		</AppBar>
	);
};

function mapStateToProps(state: storeState) {
	return ({
	  user: state.user,
	});
  }

export default connect(mapStateToProps)(Header);

