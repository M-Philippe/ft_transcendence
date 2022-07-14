import { NavLink } from "react-router-dom";
import LoginInfos from './loginInfos/loginInfos';
import { connect } from 'react-redux';
import { DispatchType, storeState } from '../store/types';
import { userState } from '../store/userSlice/userSliceTypes';
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
import UserAlertBundle from "./userAlert/UserAlertBundle";

interface IProps {
	user: userState;
	dispatch: DispatchType;
  }

  const linksNotLog = [
	{
		id: 1,
		to: '/ranking',
		name: 'Ranking'
	},
	{
		id: 2,
		to: '/login',
		name: 'Login'
	},
	{
		id: 3,
		to: '/register',
		name: 'Register'
	}
]

const linksLoged = [
	{
		id: 1,
		to: '/ranking',
		name: 'Ranking'
	},
	{
		id: 2,
		to: '/listChat',
		name: 'Chat List'
	},
	{
		id: 3,
		to: '/play',
		name: 'Play'
	},
	{
		id: 4,
		to: '/myProfile',
		name: 'Profile'
	}
]

const userMenu = [
	{
		id: 1,
		to: '/myProfile',
		name: 'Profile'
	},
	{
		id: 2,
		to: '/disconnect',
		name: 'Disconnect'
	}
]

const Header = (props: IProps) => {

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

	let keyCount = 0;

	const style = {
	paddingBottom:"17px", 
	paddingTop:"17px", 
	borderRadius:"15px",

	"&.active": {
		background: "rgba(73, 68, 68, 0.10)",
		fontWeight: "bold",
	  },
	};
	
	return (
		<AppBar id ="navBar" position="static">
		<Container maxWidth={false}>
			<Toolbar disableGutters>
			<Typography variant="h6" noWrap component={NavLink}	to="/"	sx={{mr: 2, display: { xs: 'none', md: 'flex' }, 
				fontFamily: 'monospace', fontWeight: 700, color: 'inherit', textDecoration: 'none', }}	>
					Ft_transcendence
			</Typography>

			{ props.user.isConnected && <UserAlertBundle /> }

			<Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
				<IconButton	size="large" aria-label="account of current user" aria-controls="menu-appbar" 
					aria-haspopup="true" onClick={handleOpenNavMenu} color="inherit">
				<MenuIcon />
				</IconButton>
				<Menu id="menu-appbar" anchorEl={anchorElNav} anchorOrigin={{vertical: 'bottom', horizontal: 'left', }}	
					keepMounted transformOrigin={{vertical: 'top', horizontal: 'left', }} open={Boolean(anchorElNav)} onClose={handleCloseNavMenu}	
						sx={{display: { xs: 'block', md: 'none' }, }}>
				{linkToDisplay.map(link => (
						<MenuItem key={link.name} onClick={handleCloseNavMenu} component={NavLink} to={link.to}>{link.name}</MenuItem>
				))}
				</Menu>

			</Box>
			<Typography	variant="h5" noWrap component={NavLink}	to="/" sx={{mr: 2, display: { xs: 'flex', md: 'none' },	flexGrow: 1, 
				fontFamily: 'monospace', fontWeight: 700, fontSize:20, color: 'inherit', textDecoration: 'none',}} >
				Ft_transcendence
			</Typography>

			<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
			{linkToDisplay.map(link => (
				<MenuItem key={keyCount++} sx={style} component={NavLink} to={link.to}>{link.name}</MenuItem>
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
			<IconButton aria-label="disconnect" color="error"  size="large" component={NavLink} to='/disconnect'>
			<ExitToAppIcon sx={{ fontSize: 40 }}/>
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

