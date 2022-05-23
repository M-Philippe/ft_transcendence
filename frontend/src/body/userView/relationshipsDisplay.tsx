import { useEffect, useState } from "react"
import { Link } from "react-router-dom";
import { API_GET_FRIENDSHIPS, DISCONNECTING_URL } from "../../urlConstString";

export default function RelationshipsDisplay(props: { nameProfile: string }) {
	const [friendsList, setFriendsList] = useState<Array<string>>([]);

	useEffect(() => {
		let headers = new Headers();
		headers.append("Content-Type", "application/json");
		fetch (API_GET_FRIENDSHIPS, {
			method: "post",
			credentials: "include",
			headers: headers,
			body: JSON.stringify({ nameToFetch: props.nameProfile })
		})
		.then(response => {
			if (response.status === 403)
				window.location.assign(DISCONNECTING_URL);
			return (response.json());
		})
		.then(payload => {
			if (payload.friends !== undefined && payload.friends.length !== 0)
				setFriendsList(payload.friends);
		})
	}, [setFriendsList, props.nameProfile]);

	return (
		<div>
			{friendsList.length !== 0 &&
				friendsList.map((element: any, index: number) => (
					<Link key={index} to={"/userView/:" + element}>{element}<br /> </Link>
				))
			}
			{friendsList.length === 0 && <p style={{color:'black'}}>This user don't have any friend...</p>}
		</div>
	)
}
