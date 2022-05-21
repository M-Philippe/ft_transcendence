import { useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_USER_VIEW, DISCONNECTING_URL } from "../../urlConstString";
import RelationshipsDisplay from "./relationshipsDisplay";
import InvitationGameQueryBox from "./invitationGameQueryBox";
import chooseRelationshipButton from "./chooseRelationshipButtons";
import { connect } from "react-redux";
import { storeState } from "../../store/types";
import { Link } from "react-router-dom";
import Button from '@mui/material/Button';

function assembleAchievements(achievements: any[]) {
  let retJsx = [];
  for (let i = 0; i < achievements.length; i++) {
    retJsx.push(
      <p key={i}>
        {achievements[i]}
      </p>
    );
  }
  return (retJsx);
}

function UserView(props: {username: string}) {
  const location = useLocation();
  const username = location.pathname.substr(location.pathname.indexOf(":") + 1);
  const url = API_USER_VIEW + username;
  const [refresh, setRefresh] = useState(0);

  const [data, setData] = useState({
      name: "",
      avatar: "",
      lostCount: 0,
      wonCount: 0,
      online: false,
      relationshipStatus: "none",
      achievements: [],
    }
  );
  const [load, setLoad] = useState(false);
  const [showBox, setShowBox] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { credentials: "include", signal: controller.signal })
      .then(res => {
        if (res.status === 403)
          window.location.assign(DISCONNECTING_URL);
        return (res.json());
      })
      .then(
        (res) => {
          if (res["code"] === "e2300")
            return;
          setLoad(true);
          let tmp = {
            name: res["name"],
            avatar: res["avatar"],
            lostCount: res["lostCount"],
            wonCount: res["wonCount"],
            online: res["online"],
            relationshipStatus: res["relationshipStatus"],
            achievements: res["achievements"],
          };
          //console.error(tmp.achievements);
          setData(tmp);
        },
        (error) => {}
      );
      return () => {
        controller.abort();
      }
  }, [url, refresh]);

  if (props.username === username) {
    return (
			<Navigate replace to="/myProfile" />

    )
  }

  if (load) {
    return (
      <div>
        <b><p>{data.name}</p></b>
        <img id = "avatarMyProfil" src={data.avatar} alt="Avatar"/>
        {
          data.online &&
          <b><p style={{color:"#00FF00"}}>ONLINE</p></b>
        }
        {
          data.online && !showBox &&
          <Button variant="contained" color="success" onClick={() => {
            setShowBox(true);
          }}>Invite to play a game!</Button>
        }
        {
          data.online && showBox &&
          <InvitationGameQueryBox nameProfile={data.name} setShowBox={setShowBox} />
        }
        <br />
        {
          !data.online &&
          <b><p style={{color:"#FF4500"}}>OFFLINE</p></b>
        }
        <p>wonCount: {data.wonCount} &emsp;&emsp; lostCount: {data.lostCount}</p>
        {
          data.achievements.length !== 0 &&
          assembleAchievements(data.achievements)
        }
        {chooseRelationshipButton(data.relationshipStatus, data.name, setRefresh)}
        {data.name !== "" && <RelationshipsDisplay nameProfile={data.name} />}
  			<Button component={Link} to="/matchHistory" variant="contained" state={{username: username}}>Match History</Button>
      </div>
    )
  }

  return(<div><p>Fetching User</p></div>);
}

function mapStateToProps(state: storeState) {
  return ({
    username: state.user.username
  });
}

export default connect(mapStateToProps)(UserView);
