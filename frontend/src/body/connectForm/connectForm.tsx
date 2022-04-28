import React, { useState } from 'react';
import { DispatchType, storeState } from '../../store/types';
import { connect } from 'react-redux';
import { userState } from '../../store/userSlice/userSliceTypes';
import { CONNECTION_SERVER_APPROVED, UPDATE_USERNAME } from '../../store/userSlice/userSliceActionTypes';

interface ConnectFormProps {
  user: userState;
  dispatch: DispatchType;
}

function ConnectForm(props: ConnectFormProps) {
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.dispatch(
      {
        type: UPDATE_USERNAME,
        user: {...props.user, username: event.target.value},
      }
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let req = new XMLHttpRequest();
    req.open("put", "http://localhost:3000/users/connectUser");
    req.onreadystatechange = function() {
      if (req.readyState === XMLHttpRequest.DONE && req.status === 200) {
        let response = JSON.parse(req.responseText);
        /*
        ** username, idUser, avatar.
        */
        props.dispatch({
          type: CONNECTION_SERVER_APPROVED,
          user: {
            ...props.user,
            username: response.username,
            idUser: response.idUser,
            avatar: response.avatar,
          }
        });
      } else if (req.readyState === XMLHttpRequest.DONE && req.status !== 200) {
        setErrorMessage("Problem Connecting, please retry");
      }
    }
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({ username: props.user.username }));
  };

  return (
    <div>
    {
      errorMessage !== "" &&
      <p>{errorMessage}</p>
    }
    <form id="className" onSubmit={(event) => { handleSubmit(event) }}>
      <label>
        Username:
        <input type="text" onChange={(event) => {handleChange(event) }} />
      </label>
    </form>
    <a href="http://localhost:3000/auth/42/login">LOGIN WITH 42</a>
    </div>
  );
}

function mapStateToProps(state: storeState) {
  return ({
    user: state.user,
  });
}

export default connect(mapStateToProps)(ConnectForm);
