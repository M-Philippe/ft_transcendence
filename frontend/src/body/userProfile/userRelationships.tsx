import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_GET_ALL_RELATIONSHIPS, DISCONNECTING_URL } from '../../urlConstString';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import * as React from 'react';

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
		ret.push(<p key={countKeys++} style={{color:'green',border: "1px solid green", borderRadius:'10px'}}>FRIENDS :</p>);
		for (let i = 0; i < acceptedFriendships.length; i++) {
			ret.push(<Link key={countKeys++} to={pathLink + acceptedFriendships[i]}>{acceptedFriendships[i]}</Link>);
			ret.push(<br key={countKeys++}/>);
		}
	}
	if (pendingFriendships.length > 0) {
		ret.push(<p key={countKeys++} style={{color:'orange', border: "1px solid orange", borderRadius:'10px'}}>PENDING</p>);
		for (let i = 0; i < pendingFriendships.length; i++) {
			ret.push(<Link key={countKeys++} to={pathLink + pendingFriendships[i]}>{pendingFriendships[i]}</Link>);
			ret.push(<br key={countKeys++}/>);
		}
	}
	if (refusedFriendships.length > 0) {
		ret.push(<p key={countKeys++} style={{color:'red',border: "1px solid red", borderRadius:'10px'}}>REFUSED</p>);
		for (let i = 0; i < refusedFriendships.length; i++) {
			ret.push(<Link key={countKeys++} to={pathLink + refusedFriendships[i]}>{refusedFriendships[i]}</Link>);
			ret.push(<br key={countKeys++}/>);
		}
	}
	if (blockedFriendships.length > 0) {
		ret.push(<p key={countKeys++} style={{color:'red',border: "1px solid red", borderRadius:'10px'}}>BLOCKED</p>);
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
	const [open, setOpen] = React.useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);

	const style = {
	position: 'absolute' as 'absolute',
	top: '50%',
	left: '40%',
	transform: 'translate(-50%, -50%)',
	width: 'auto',
	bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
	p: 4,
	};

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
		<Box sx={{ width: '100%', }}>
		<Stack spacing={2}>
		<Button variant="contained" onClick={handleOpen}>
			Relations
		</Button>
		</Stack>
			<Modal
				open={open}
				onClose={handleClose}
				>
				<Box sx={style}>
				<Typography variant="h5" sx={{borderBottom: 2}}>
				Relations
				</Typography>
				<Typography variant="subtitle1" sx={{ mt: 2, textAlign: 'center' }}>
				<Stack>
				{
					listRelationships.length !== 0 &&
					renderListRelationships(listRelationships)
				}
				{
					listRelationships.length === 0 &&
					<p style={{color:'black'}}>You don't have any relation...</p>
				}
				<Button variant="contained" color="error" onClick={handleClose}>
					Close
				</Button>
				</Stack>
				</Typography>
				</Box>
				</Modal>
			</Box>
	);
}
