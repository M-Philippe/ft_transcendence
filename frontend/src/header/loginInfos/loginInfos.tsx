import { storeState } from '../../store/types';
import {connect} from "react-redux";

function LoginInfos(props: any) {
//console.log("AVATAR: ", props.user.avatar);
  if (props.user.isConnected) {
      return (
        <div>
          {/* <p className="login">Hello {props.user.username}</p> */}
          <img className = "avatar" style={{width: "7vw", height: "9vh"}} src={props.user.avatar} alt="avatarUser" />
      </div>
      );
    }
    return (
      <p className="login">FT_TRANSCENDENCE</p>
    );
}

function mapStateToProps(state: storeState) {
  return ({
    user: state.user,
  });
}

export default connect(mapStateToProps)(LoginInfos);
