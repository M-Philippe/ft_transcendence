import CSS from 'csstype';
import { storeState } from '../../../store/types';
import { connect } from 'react-redux';

interface IRankingUsersUnitProps {
  name: string;
  wonCount: number;
  lostCount: number;
  key: number;
}

function ListCompElement(props: any) {

  let paragraphStyle: CSS.Properties = {
    "border": "none",
  };
  if (props.name === props.username) {
    paragraphStyle["border"] = "solid 1px";
  }

  return (
    <p style={paragraphStyle}>
      {props.name}
      | V: {props.wonCount}
      | D: {props.lostCount}
    </p>
  );
}

function mapStateToProps(state: storeState, ownProps: IRankingUsersUnitProps) {
  return ({
    username: state.user.username,
    isConnected: state.user.isConnected,
  });
}

export default connect(mapStateToProps)(ListCompElement);