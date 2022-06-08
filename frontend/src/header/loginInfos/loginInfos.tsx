import { storeState } from '../../store/types';
import {connect} from "react-redux";
import Avatar from '@mui/material/Avatar';

function LoginInfos(props: any) {
  if (props.user.isConnected) {
      return (
      <div>
				<Avatar alt="avatar" src={props.user.avatar} />
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
