import React, { SetStateAction } from "react";
import { API_ADD_FRIEND, API_BLOCK_USER, API_UNBLOCK_USER, API_UNFRIEND_USER, DISCONNECTING_URL } from "../../urlConstString";
import Button from '@mui/material/Button';

function assembleUnblockButton(nameUserFetched: string, countKeys: number, setRefresh: React.Dispatch<SetStateAction<number>>) {
  return (
    <Button variant="contained" color="warning" key={countKeys} onClick={() => {
      let headers = new Headers();
      headers.append("Content-Type", "application/json");
      fetch(API_UNBLOCK_USER, {
        method: "post",
        credentials: "include",
        headers: headers,
        body: JSON.stringify({
          usernameToUnblock: nameUserFetched,
        })
      })
      .then(response => {
        if (response.status === 403)
          window.location.assign(DISCONNECTING_URL);
        else if (response.status === 201) {
          console.error("SET_REFRESH");
          setRefresh(Date.now());
        }
      })
      }}> Unblock
    </Button>
  );
}

function assembleBlockButton(nameUserFetched: string, countKeys: number, setRefresh: React.Dispatch<SetStateAction<number>>) {
  return (
    <Button variant="contained" color="error" key={countKeys} onClick={() => {
      let headers = new Headers();
      headers.append("Content-Type", "application/json");
      fetch(API_BLOCK_USER, {
        method: "post",
        credentials: "include",
        headers: headers,
        body: JSON.stringify({
          usernameToBlock: nameUserFetched
        })
      })
      .then(response => {
        if (response.status === 403)
          window.location.assign(DISCONNECTING_URL);
        else if (response.status === 201)
          setRefresh(Date.now());
      })
      }}>Block this user</Button>
  );
}

function assembleAddFriendButton(nameUserFetched: string, countKeys: number, setRefresh: React.Dispatch<SetStateAction<number>>) {
  return (
    <Button variant="contained" key={countKeys} onClick={() => {
      // Send friend request to back.
      let headers = new Headers();
      headers.append("Content-Type", "application/json");
      fetch(API_ADD_FRIEND, {
        method: "post",
        credentials: "include",
        headers: headers,
        body: JSON.stringify({
          usernameToAdd: nameUserFetched
        })
      })
      .then(response => {
        if (response.status === 403)
          window.location.assign(DISCONNECTING_URL);
        else if (response.status === 201)
          setRefresh(Date.now());
      });
      }}>
      Add to friends
    </Button>
  );
}

function assembleUnfriendButton(nameUserFetched: string, countKeys: number, setRefresh: React.Dispatch<SetStateAction<number>>) {
  return (
    <Button variant="contained" color="error" key={countKeys} onClick={() => {
      // Send friend request to back.
      console.log("UNFRIEND");
      let headers = new Headers();
      headers.append("Content-Type", "application/json");
      fetch(API_UNFRIEND_USER, {
        method: "post",
        credentials: "include",
        headers: headers,
        body: JSON.stringify({
          nameToUnfriend: nameUserFetched
        })
      })
      .then(response => {
        if (response.status === 403)
          window.location.assign(DISCONNECTING_URL);
        else if (response.status === 201)
          setRefresh(Date.now());
      });
      }}>
      Remove from my Friends.
    </Button>
  );
}

export default function chooseRelationshipButton(relationshipStatus: string, nameUserFetched: string, setRefresh: React.Dispatch<React.SetStateAction<number>>) {
  let jsxArray: JSX.Element[] = [];
  let countKeys: number = 0;
  if (relationshipStatus === "blocker") {
    jsxArray.push(assembleUnblockButton(nameUserFetched, countKeys++, setRefresh));
  } else if (relationshipStatus === "accepted") {
    jsxArray.push(assembleUnfriendButton(nameUserFetched, countKeys++, setRefresh));
    jsxArray.push(assembleBlockButton(nameUserFetched, countKeys++, setRefresh));
  } else if (relationshipStatus === "refused") {
    jsxArray.push(assembleAddFriendButton(nameUserFetched, countKeys++, setRefresh));
    jsxArray.push(assembleBlockButton(nameUserFetched, countKeys++, setRefresh));
  } else if (relationshipStatus === "none") {
    jsxArray.push(assembleAddFriendButton(nameUserFetched, countKeys++, setRefresh));
    jsxArray.push(assembleBlockButton(nameUserFetched, countKeys++, setRefresh));
  } else {
    jsxArray.push(<div key={countKeys++}></div>);
  }
  return (jsxArray);
}
