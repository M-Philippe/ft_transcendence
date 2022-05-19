import SearchBar from './searchBar/searchBar';
import {NavLink, Navigate} from "react-router-dom";
import LoginInfos from './loginInfos/loginInfos';
import { connect } from 'react-redux';
import { DispatchType, storeState } from '../store/types';
import { useEffect, useState } from 'react';
import { DISCONNECT_USER } from '../store/userSlice/userSliceActionTypes';
import { userState } from '../store/userSlice/userSliceTypes';
import UserAlert from "./userAlert/userAlert";

interface IProps {
  user: userState;
  dispatch: DispatchType;
}

function Header(props: IProps) {
  const [redirectDisconnect, setRedirectDisconnect] = useState(false);

  useEffect(() => {
	if (redirectDisconnect) {
	  props.dispatch({
		type: DISCONNECT_USER,
		user: props.user,
	  });
	  setRedirectDisconnect(false);
	}
  }, [redirectDisconnect, props]);

  if (redirectDisconnect) {
	return (<Navigate replace to="/disconnect" />);
  } else {
	return (
	<header>
		<div id="LogInfoAvatAlert">
			<LoginInfos />
			<h3 className="login"> { props.user.username } </h3> 
			{/* { props.user.isConnected && <SearchBar /> } */}
			{ props.user.isConnected && <UserAlert /> }
		</div>
		<nav>
			<ul>
				<li><NavLink to="/ranking">Ranking</NavLink> </li>
				{
				props.user.isConnected &&
				<li><NavLink  to="/listChat">Chat List</NavLink> </li>
				}
				{!props.user.isConnected && <li><NavLink to="/login">Login</NavLink> </li>} 
				{!props.user.isConnected && <li><NavLink to="/register">Register</NavLink> </li>} 
				{
				props.user.isConnected &&
				<li><NavLink to="/play">Play</NavLink> </li>
				}
				{
				props.user.isConnected &&
				<li><NavLink to="/myProfile">Profile</NavLink> </li>
				}
				{
					props.user.isConnected &&
					<li><NavLink id = "disconnectButton" to="/" onClick={() => {setRedirectDisconnect(true);}}> Disconnect </NavLink> </li>
				}
			</ul>
  		</nav>
	  </header>
	);
  }
}

function mapStateToProps(state: storeState) {
  return ({
	user: state.user,
  });
}

export default connect(mapStateToProps)(Header);
