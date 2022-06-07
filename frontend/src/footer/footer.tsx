import { connect } from "react-redux";
import { storeState } from "../store/types";

function Footer(props: { isInGame: boolean, isConnected: boolean }) 
{
  if (props.isInGame)
    return (null);
  if (!props.isConnected)
    return (
      <footer style={{color:'white'}}>
      © pminne vroth-di ninieddu
      </footer>
    );   
  else
    return (
      <footer style={{paddingRight:"24vw", color:'white'}}>
      © pminne vroth-di ninieddu
      </footer>
    )
}

function mapStateToProps(state: storeState) {
  return ({
    isInGame: state.user.isInGame,
    isConnected: state.user.isConnected
  });
}

export default connect(mapStateToProps)(Footer);