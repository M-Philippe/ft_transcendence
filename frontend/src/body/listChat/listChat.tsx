import React, { SetStateAction, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { storeState } from '../../store/types';
import { MouseEventHandler } from 'react';
import { API_GET_LIST_CHAT, API_SUSCRIBE_CHAT } from '../../urlConstString';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

const loadData = async (data: any[], setData: React.Dispatch<SetStateAction<any[]>>, url: string) => {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      credentials: "include",
      mode: 'cors'
    });
    if (!response.ok)
      return null;
    data = await response.json();
    setData(data);
  } catch (error) {
    console.log("Problem connecting with backend");
  }
}

const suscribeToChat = async (username: string, idChat: number, setLoad: React.Dispatch<React.SetStateAction<boolean>>)  => {
  var myHeaders = new Headers();
  myHeaders.append("username", username);
  myHeaders.append("idChat", idChat.toString());
  var myInit: RequestInit = { method: 'GET',
               headers: myHeaders,
               credentials: "include",
               mode: 'cors',
               cache: 'default' };

  let response: Response;
  try {
    response = await fetch(API_SUSCRIBE_CHAT, myInit);
    console.log("IS THIS HERE?");
    if (!response.ok)
      return null;
    // let returnedBody = await response.text();
    //if (returnedBody === "Chat not availaible")
    setLoad(false);
  } catch (error) {
    console.log("Problem connecting with backend");
  }
  return (undefined);
}

function wrapperSuscribeToChat(username: string, idChat: number, setLoad: React.Dispatch<React.SetStateAction<boolean>>) : MouseEventHandler<HTMLButtonElement> | undefined {
  suscribeToChat(username, idChat, setLoad);
  return (undefined);
}

function ListChat(props: any) {
	const [data, setData] = React.useState<Array<any>>([]);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (!load) {
      let ret = loadData(data, setData, API_GET_LIST_CHAT);
      if (ret != null)
        setLoad(true);
    }
  }, [load, data])

  return (
		<Box sx={{ width: '100%' }}>

      <button id = "bulleButtonTricks"></button>
      {data.length !== 0 && <p>Click on the chat button you want to join :</p>}
		<Box id = "chatListStack" sx={{ width: '100%' }}>
    <Stack spacing={2}>
      {data.length !== 0 &&
        data.map((element: any, index: number) => (
          //index != 0 && Put this line to remove chat 0.
          
          <div key={index}>
          <Button variant="contained" min-height="2vh" key={index} onClick={() => wrapperSuscribeToChat(props.username, element.idChat, setLoad)}> {element.chatName} </Button>
          </div>
        ))
      }
      {
        data.length === 0 &&
        <p>No chat available</p>
      }
			</Stack>
    </Box>
    </Box>
  );
}

function mapStateToProps(state: storeState, ownProps: any) {
	return ({
	  username: state.user.username,
	});
  }

  export default connect(mapStateToProps)(ListChat);
