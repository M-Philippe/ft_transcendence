import { useLocation } from "react-router";
import { useEffect, useState } from "react";
import { API_USER_VIEW, DISCONNECTING_URL, USER_MY_PROFILE } from "../../urlConstString";
import RelationshipsDisplay from "./relationshipsDisplay";
import InvitationGameQueryBox from "./invitationGameQueryBox";
import chooseRelationshipButton from "./chooseRelationshipButtons";
import { connect } from "react-redux";
import { storeState } from "../../store/types";
import { Redirect } from "react-router";

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
      <Redirect to="/myProfile" />
    )
  }

  if (load) {
    return (
      <div>
        <p>Name: {data.name}</p>
        <img style={{width: "150px", height: "80px"}} src={data.avatar} alt="Avatar"/>
        {
          data.online &&
          <p>ONLINE</p>
        }
        {
          data.online && !showBox &&
          <button onClick={() => {
            setShowBox(true);
          }}>Invite to play a game!</button>
        }
        {
          data.online && showBox &&
          <InvitationGameQueryBox nameProfile={data.name} setShowBox={setShowBox} />
        }
        <br />
        {
          !data.online &&
          <p>OFFLINE</p>
        }
        <p>wonCount: {data.wonCount} | lostCount: {data.lostCount}</p>
        {
          data.achievements.length !== 0 &&
          assembleAchievements(data.achievements)
        }
        {chooseRelationshipButton(data.relationshipStatus, data.name, setRefresh)}
        {data.name !== "" && <RelationshipsDisplay nameProfile={data.name} />}
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
