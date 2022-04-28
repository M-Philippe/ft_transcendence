import SearchBar from './searchBar/searchBar';
import {Link, Redirect} from "react-router-dom";
import LoginInfos from './loginInfos/loginInfos';
import styles from './link.module.css';
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
      <div id="header">
        <LoginInfos />
        <SearchBar />
        {props.user.isConnected && <UserAlert />}
        <div className={styles.divLink}>
          <Link className={styles.headerLink} to="/ranking">Ranking</Link>
          <Link className={styles.headerLink} to="/listChat">listChat</Link>
          {!props.user.isConnected && <Link className={styles.headerLink} to="/login">Login</Link>}
          {!props.user.isConnected && <Link className={styles.headerLink} to="/register">Register</Link> }
          {
            props.user.isConnected &&
            <Link className={styles.headerLink} to="/play">Play</Link>
          }
          {
            props.user.isConnected &&
            <Link to="/myProfile">My Profile</Link>
          }
          {
            props.user.isConnected &&
            <button onClick={() => {
              setRedirectDisconnect(true);
            }}>
              Disconnect
            </button>
          }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: storeState) {
  return ({
    user: state.user,
  });
}

export default connect(mapStateToProps)(Header);
