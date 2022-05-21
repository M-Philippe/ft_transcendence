import { storeState } from '../../store/types';
import {connect} from "react-redux";
import Avatar from '@mui/material/Avatar';

function LoginInfos(props: any) {
//console.log("AVATAR: ", props.user.avatar);
  if (props.user.isConnected) {
      return (
        <div>
          {/* <p className="login">Hello {props.user.username}</p> */}
				<Avatar alt="avatar" src={props.user.avatar} />
          {/* <img id = "avatarHeader" className="imgHeader" src={props.user.avatar} alt="avatarUser" /> */}
      </div>
      );
    }
    return (null);
}

function mapStateToProps(state: storeState) {
  return ({
    user: state.user,
  });
}

export default connect(mapStateToProps)(LoginInfos);
