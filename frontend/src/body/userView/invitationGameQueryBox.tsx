import { useState } from "react";
import { API_USER_INVITE_MATCH, DISCONNECTING_URL } from '../../urlConstString';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import NativeSelect from '@mui/material/NativeSelect';

interface rules {
  scoreMax: number,
  powerUp: boolean,
  map: string,
}

export default function InvitationGameQueryBox(props: { nameProfile: string, closePopUp : Function}) {
	const [rules, setRules] = useState<rules>({
    scoreMax: 3,
    powerUp: true,
    map: "original",
  });

	return (
		<div>
			<h3>{props.nameProfile}</h3>
      <Stack sx={{alignItems:"center"}} spacing={5}>
      <FormControl >
        <InputLabel variant="standard" htmlFor="uncontrolled-native">
          Points
        </InputLabel>
        <NativeSelect color="primary" onChange={(event) => {setRules({...rules, scoreMax: parseInt(event.target.value)}); }}
          defaultValue={"3"}
          inputProps={{
            name: 'Points',
            id: 'uncontrolled-native',
          }} >
          <option value="3">3</option>
          <option value="5">5</option>
          <option value="7">7</option>
          </NativeSelect>
          </FormControl>
        <FormControl >
        <InputLabel variant="standard" htmlFor="uncontrolled-native">
          Power-Ups
        </InputLabel>
        <NativeSelect color="primary" onChange={(event) => {
          if (event.target.value === "yes")
          setRules({...rules, powerUp: true});
          else
          setRules({...rules, powerUp: false});
        }}>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </NativeSelect>
        </FormControl>
        <FormControl >
        <InputLabel variant="standard" htmlFor="uncontrolled-native">
          Map
        </InputLabel>
        <NativeSelect color="primary" onChange={(event) => {
          setRules({...rules, map: event.target.value})
        }}>
          <option value="original">Original</option>
          <option value="desert">Desert</option>
          <option value="jungle">Jungle</option>
        </NativeSelect>
        </FormControl>
		  	</Stack>
				<br /><br />
				<Button variant="contained" color="success" onClick={() => {
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
						if (response.status === 403)
							window.location.assign(DISCONNECTING_URL);
					})
          .catch(error => {});
          props.closePopUp(true)}}>
					Invite
			 </Button>
       &nbsp;
				<Button variant="contained" color="error" onClick={() => props.closePopUp(true)} >Cancel</Button>
		</div>
	);
}
