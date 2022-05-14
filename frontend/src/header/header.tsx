import SearchBar from './searchBar/searchBar';
import {Link, Redirect} from "react-router-dom";
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
    return (<Redirect to="/disconnect" />);
  } else {
    return (
      <header>
        <LoginInfos />
        <p className="login"> { props.user.username } </p> 
        {/* { props.user.isConnected && <SearchBar /> } */}
        { props.user.isConnected && <UserAlert /> }
        <Link className="action-button shadow animate yellow" to="/ranking">Ranking</Link>
        {
          props.user.isConnected &&
          <Link className="action-button shadow animate orange" to="/listChat">Chat List</Link>
        }
        {!props.user.isConnected && <Link className="action-button shadow animate green" to="/login">Login</Link>}
        {!props.user.isConnected && <Link className="action-button shadow animate blue" to="/register">Register</Link> }
        {
          props.user.isConnected &&
          <Link className="action-button shadow animate green" to="/play">Play</Link>
        }
        {
          props.user.isConnected &&
          <Link className="action-button shadow animate blue" to="/myProfile">Profile</Link>
        }
        {
          props.user.isConnected &&
          <button className="action-button shadow animate red" onClick={() => {setRedirectDisconnect(true);}}> Disconnect </button>
        }
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
