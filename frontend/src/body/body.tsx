import '../styles/index.css';
import '../styles/chat.css';
import { Routes, Route, Navigate } from "react-router-dom";
import PlayRoute from './board/playRoute';
import RankingUsers from './ranking/rankingUsers/rankingUsers';
import UserView from "./userView/userView";
import ListChat from "./listChat/listChat";
import { connect } from 'react-redux';
import { storeState } from '../store/types';
import { userState } from '../store/userSlice/userSliceTypes';
import UserProfile from "./userProfile/userProfile";
import LoginFail from './login/loginFail';
import LoginSuccess from './login/loginSuccess';
import FirstLogin from "./login/firstLogin";
import Disconnecting from "./disconnecting/disconnecting";
import Enable2fa from './userProfile/2fa/enable2fa';
import Query2faCode from './login/query2faCode';
import Register from './register/register';
import LoginForm from './login/loginForm';
import InvitationGame from './board/invitationGame/invitationGame';
import { API_USER_RANKING } from "../urlConstString";

interface PropsBody {
  user: userState,
}

function Body(props: PropsBody) {
  return (
    <div id="content">
      <Routes>
        <Route path="*" element={<Navigate replace to="/" />}/>
        <Route path="/" element={ <RankingUsers url={API_USER_RANKING} /> } />
        <Route path="/ranking" element={ <RankingUsers url={API_USER_RANKING} /> } />
        <Route path="/listChat" element={<ListChat />} />
        <Route path="/play" element={ <PlayRoute />} />
        <Route path="/login" element={ <LoginForm {...props} />} />
        { props.user.isConnected && <Route path="/connectionForm" element={<Navigate replace to="/" />} /> } 
        <Route path="/register" element={<Register />} />
        <Route path="/userView/:username" element={<UserView />} />
        <Route path="/myProfile" element={<UserProfile />}/>
        <Route path="/loginFailed" element={<LoginFail />} />
        <Route path="/loginSuccess" element={<LoginSuccess />} />
        <Route path="/firstLogin" element={<FirstLogin />} />
        <Route path="/disconnecting" element={<Disconnecting />} />
        <Route path="/enable2fa" element={<Enable2fa />}/>
        <Route path="/query2faCode" element={<Query2faCode />} />
        <Route path="/disconnect" element={<Disconnecting />} />
        <Route path="/invitationGame" element={ <InvitationGame />} />
      </Routes>
    </div>
  );
}

function mapStateToProps(state: storeState) {
  return ({
    user: state.user,
  })
}

export default connect (mapStateToProps)(Body);
