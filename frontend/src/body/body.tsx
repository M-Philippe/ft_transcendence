import '../styles/index.css';
import '../styles/chat.css';
import {Switch, Route, Redirect} from "react-router-dom";
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

// Add route GameByInvite

function Body(props: PropsBody) {
  return (
    <div id="body">
      <Switch>
        <Route exact path="/" render={() =>
          <RankingUsers
            url={API_USER_RANKING}
          />}
        />
        <Route exact path="/ranking" render={() =>
          <RankingUsers
            url={API_USER_RANKING}
          />
          }
        />
        <Route exact path="/listChat" component={ListChat} />
        <Route exact path="/play" render={() => <PlayRoute />} />
        {!props.user.isConnected &&
          <Route
            exact path="/login"
            render={() => <LoginForm {...props} />}
          />
        }
        {props.user.isConnected &&
          <Redirect from ="/connectionForm" to="/" />
        }
        <Route exact path="/register" component={Register} />
        <Route exact path="/userView/:username" component={UserView} />
        <Route exact path="/myProfile" component={UserProfile}/>
        <Route exact path="/loginFailed" component={LoginFail} />
        <Route exact path="/loginSuccess" component={LoginSuccess} />
        <Route exact path="/firstLogin" component={FirstLogin} />
        <Route exact path="/disconnecting" component={Disconnecting} />
        <Route exact path="/enable2fa" component={Enable2fa}/>
        <Route exact path="/query2faCode" component={Query2faCode} />
        <Route exact path="/disconnect" component={Disconnecting} />
        <Route exact path="/invitationGame" render={() => <InvitationGame />} />
      </Switch>
    </div>
  );
}

function mapStateToProps(state: storeState) {
  return ({
    user: state.user,
  })
}

export default connect (mapStateToProps)(Body);
