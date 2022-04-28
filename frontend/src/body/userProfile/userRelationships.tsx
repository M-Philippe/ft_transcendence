import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_GET_ALL_RELATIONSHIPS, DISCONNECTING_URL } from '../../urlConstString';

interface listRelationships {
	status: string,
	username: string,
}

/*
**	Should remove pendingFriendships?
*/
function renderListRelationships(listRelationships: listRelationships[]) {
	const acceptedFriendships: string[] = [];
	const refusedFriendships: string[] = [];
	const pendingFriendships: string[] = [];
	const blockedFriendships: string[] = [];
	for (let i = 0; i < listRelationships.length; i++) {
		if (listRelationships[i].status === "accepted")
			acceptedFriendships.push(listRelationships[i].username);
		else if (listRelationships[i].status === "refused")
			refusedFriendships.push(listRelationships[i].username);
		else if (listRelationships[i].status === "pending")
			pendingFriendships.push(listRelationships[i].username);
		else if (listRelationships[i].status === "blocked")
			blockedFriendships.push(listRelationships[i].username);
	}
	const ret = [];
	let pathLink = "/userView/:";
	let countKeys: number = 0;
	if (acceptedFriendships.length > 0) {
		ret.push(<p key={countKeys++} style={{border: "1px solid black"}}>FRIENDS</p>);
		for (let i = 0; i < acceptedFriendships.length; i++) {
			ret.push(<Link key={countKeys++} to={pathLink + acceptedFriendships[i]}>{acceptedFriendships[i]}</Link>);
			ret.push(<br key={countKeys++}/>);
		}
	}
	if (pendingFriendships.length > 0) {
		ret.push(<p key={countKeys++} style={{border: "1px solid black"}}>PENDING</p>);
		for (let i = 0; i < pendingFriendships.length; i++) {
			ret.push(<Link key={countKeys++} to={pathLink + pendingFriendships[i]}>{pendingFriendships[i]}</Link>);
			ret.push(<br key={countKeys++}/>);
		}
	}
	if (refusedFriendships.length > 0) {
		ret.push(<p key={countKeys++} style={{border: "1px solid black"}}>REFUSED</p>);
		for (let i = 0; i < refusedFriendships.length; i++) {
			ret.push(<Link key={countKeys++} to={pathLink + refusedFriendships[i]}>{refusedFriendships[i]}</Link>);
			ret.push(<br key={countKeys++}/>);
		}
	}
	if (blockedFriendships.length > 0) {
		ret.push(<p key={countKeys++} style={{border: "1px solid black"}}>BLOCKED</p>);
		for (let i = 0; i < blockedFriendships.length; i++) {
			ret.push(<Link key={countKeys++} to={pathLink + blockedFriendships[i]}>{blockedFriendships[i]}</Link>);
			ret.push(<br key={countKeys++}/>);
		}
	}
	return (ret);
}

export default function UserRelationships(props: any) {
	const [listRelationships, setListRelationships] = useState<listRelationships[]>([]);
	const [load, setLoad] = useState(true);

	useEffect(() => {
		if (load) {
			fetch(API_GET_ALL_RELATIONSHIPS, {
				method: "get",
				credentials: "include"
			})
			.then(response => {
				if (response.status === 403)
					window.location.assign(DISCONNECTING_URL);
				return response.json();
			})
			.then(payload => {
				//console.log("RECEIVED: ", payload);
				if (payload.length !== 0) {
					setListRelationships(payload);
				}
			})
			setLoad(false);
		}
	}, [load]);

	return (
		<div>
			{
				listRelationships.length !== 0 &&
				renderListRelationships(listRelationships)
			}
		</div>
	);
}
