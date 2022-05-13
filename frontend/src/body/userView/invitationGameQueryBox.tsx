import { useState } from "react";
import { API_USER_INVITE_MATCH, DISCONNECTING_URL } from "../../urlConstString";

interface rules {
  scoreMax: number,
  powerUp: boolean,
  map: string,
}


export default function InvitationGameQueryBox(props: { nameProfile: string, setShowBox: React.Dispatch<React.SetStateAction<boolean>> }) {
	const [rules, setRules] = useState<rules>({
    scoreMax: 3,
    powerUp: true,
    map: "original",
  });

	return (
		<div>
			<p>Choose your rules to play against : {props.nameProfile}</p>
			<p>Points</p>
        <select onChange={(event) => {
          setRules({...rules, scoreMax: parseInt(event.target.value)});
        }}>
          <option value="3">3</option>
          <option value="5">5</option>
          <option value="7">7</option>
        </select>
        <p>Power-Ups</p>
        <select onChange={(event) => {
          if (event.target.value === "yes")
            setRules({...rules, powerUp: true});
          else
            setRules({...rules, powerUp: false});
        }}>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        <p>Map</p>
        <select onChange={(event) => {
          setRules({...rules, map: event.target.value})
        }}>
          <option value="original">Original</option>
          <option value="desert">Desert</option>
          <option value="jungle">Jungle</option>
        </select>
				<br /><br />
				<button className="action-button shadow animate green" onClick={() => {
					let headers = new Headers();
					headers.append("Content-Type", "application/json");
					fetch(API_USER_INVITE_MATCH, {
						method: "post",
						credentials: "include",
						headers: headers,
						body: JSON.stringify({
							usernameToInvite: props.nameProfile,
							rules: rules,
						})
					})
					.then(response => {
						console.log("STATUS: ", response.status);
						if (response.status === 403)
							window.location.assign(DISCONNECTING_URL);
					});
					props.setShowBox(false);
				}}>
					Invite
				</button>
				<button className="action-button shadow animate red" onClick={() => { props.setShowBox(false); }}>Cancel</button>
		</div>
	);
}
