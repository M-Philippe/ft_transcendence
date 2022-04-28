import React, { SetStateAction, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { storeState } from '../../store/types';
import { MouseEventHandler } from 'react';
import { API_GET_LIST_CHAT, API_SUSCRIBE_CHAT } from '../../urlConstString';

const loadData = async (data: any[], setData: React.Dispatch<SetStateAction<any[]>>, url: string) => {
  let response: Response;
  try {
    response = await fetch(url);
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
               mode: 'cors',
               cache: 'default' };

  let response: Response;
  try {
    response = await fetch(API_SUSCRIBE_CHAT, myInit);
    if (!response.ok)
      return null;
    let returnedBody = await response.text();
    if (returnedBody === "Chat not availaible")
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
    <div>
      <p>CLICK ON ONE CHAT TO SUSCRIBE TO IT</p>
      {data.length !== 0 &&
        data.map((element: any, index: number) => (
          <div key={index}>
          <p style={{display:"inline"}}>{element.chatName}</p>
          <button
            key={index}
            onClick={() => wrapperSuscribeToChat(props.username, element.idChat, setLoad)}
          >
              JOIN
          </button>
          <br />
          </div>
        ))
      }
    </div>
  );
}

function mapStateToProps(state: storeState, ownProps: any) {
	return ({
	  username: state.user.username,
	});
  }

  export default connect(mapStateToProps)(ListChat);
