import { useEffect, useReducer, useState } from "react";
import { Socket } from 'socket.io-client';
/* Keep this in case of future compatibility problem */
//import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
/* Usual import */
import { DefaultEventsMap } from '@socket.io/component-emitter/index';
import { ChatDisplay } from './chatDisplay';
import DisplayButtonsChat from './displayButtonsChat';
import ChatInput from './chatInput';
import ChatCommandHelp from './chatCommandHelp';
import ChatErrorMessage from './chatErrorMessage';
import { API_USER_LIST_CHAT, DISCONNECTING_URL } from "../../../urlConstString";
import AddBoxIcon from '@mui/icons-material/AddBox';
import IconButton from '@mui/material/IconButton';

interface PropsChatConnected {
  name: string,
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
}

export type State = {
  messages: string[];
  timeMessages: string[];
  usernames: string[];
  lstId: number[];
  lstButtonsGreen: number[];
  load: boolean;
  chatFocusId: number;
  refresh: boolean;
  errorDisplay: boolean;
  errorMessage: string;
}

export type Action = {
  type: string;
  messages?: string[];
  timeMessages?: string[];
  usernames?: string[];
  lstId?: number[];
  lstButtonsGreen?: number[];
  load?: boolean;
  chatFocusId?: number;
  errorDisplay?: boolean;
  errorMessage?: string;
}

function reducer (state: State, action: Action): State {
  switch (action.type) {
    case "CHANGE_LST_ID":
      if (action.lstId)
        return {...state, lstId: action.lstId};
      return state;
    case "CHANGE_LIST_ID_LOAD":
      if (action.lstId && action.load)
        return {...state, lstId: action.lstId, load: action.load}
      return state;
    case "UPDATE_DISPLAY":
      if (action.messages && action.timeMessages && action.usernames)
        return {...state, messages: action.messages, timeMessages: action.timeMessages, usernames: action.usernames};
      return state;
    case "UPDATE_FOCUS":
      if (action.chatFocusId !== undefined)
        return {...state, chatFocusId: action.chatFocusId, refresh: true};
      return state;
    case "FRESH_FALSE":
      return {...state, refresh: false};
    case "UPDATE_BUTTONS_GREEN":
      if (action.lstButtonsGreen)
        return {...state, lstButtonsGreen: action.lstButtonsGreen};
      return state;
    case "UPDATE_FOCUS_AND_REMOVE_GREEN":
      if (action.lstButtonsGreen && action.chatFocusId !== undefined) {
        return {...state, lstButtonsGreen: action.lstButtonsGreen, chatFocusId: action.chatFocusId, refresh: true};
      }
      return state;
    case "UPDATE_LST_ID_AND_CHAT_AND_FOCUS":
      if (action.lstId === undefined || action.messages === undefined
        || action.timeMessages === undefined || action.usernames === undefined
        || action.chatFocusId === undefined || action.lstButtonsGreen === undefined)
        return state;
      return {
        ...state,
        lstId: action.lstId,
        messages: action.messages,
        timeMessages: action.timeMessages,
        usernames: action.usernames,
        chatFocusId: action.chatFocusId,
        lstButtonsGreen: action.lstButtonsGreen,
      }
    case "SET_ERROR_DISPLAY_TRUE":
      if (action.errorMessage !== undefined)
        return {...state, errorDisplay: true, errorMessage: action.errorMessage};
      return state;
    case "SET_ERROR_DISPLAY_FALSE":
      return {...state, errorDisplay: false, errorMessage: ""};
    default:
      return state;
  }
}

type SortArrayType = <T>(arr: T[]) => T[];

const sortArray: SortArrayType = (arr) => {
  return arr.sort((a, b) => {
    const strA = JSON.stringify(a);
    const strB = JSON.stringify(b);
    if (strA < strB) {
      return -1;
    }
    if (strA > strB) {
      return 1;
    }
    return 0;
  });
};

export function ChatConnected(props: PropsChatConnected) {
  const url = API_USER_LIST_CHAT + props.name;

  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    timeMessages: [],
    usernames: [],
    lstId: [],
    lstButtonsGreen: [],
    load: false,
    chatFocusId: 0,
    refresh: false,
    errorDisplay: false,
    errorMessage: "",
  });
  const [dateClick, setDateClick] = useState(Date.now());

  props.socket.off("removeChat");
  props.socket.off("newChat");
  props.socket.off("receivedMessages");
  props.socket.off("errorMessage");
  props.socket.off("redirectToInviteProfile");

  props.socket.on("removeChat", (...args: any) => {
    if (state.lstButtonsGreen.indexOf(args[0].oldIdChat) >= 0)
      state.lstButtonsGreen.splice(state.lstButtonsGreen.indexOf(args[0].oldIdChat));
    state.lstId.splice(state.lstId.indexOf(args[0].oldIdChat), 1);
    dispatch({
      type: "UPDATE_LST_ID_AND_CHAT_AND_FOCUS",
      lstId: state.lstId,
      messages: args[0].newMessages,
      timeMessages: args[0].newTimeMessages,
      usernames: args[0].newUsernames,
      chatFocusId: args[0].newChatId - 1,
      lstButtonsGreen: state.lstButtonsGreen,
    });
  })

  props.socket.on("newChat", (...args: any) => {
    if (state.lstId.indexOf(args[0].newChatId) >= 0)
      return;
    let tmp = state.lstId;
    tmp.push(args[0].newChatId);
    tmp.sort(function(a, b){return a - b});
    dispatch({type: "CHANGE_LST_ID", lstId: tmp});
    state.lstButtonsGreen.push(args[0].newChatId);
    dispatch({type: "UPDATE_BUTTONS_GREEN", lstButtonsGreen: state.lstButtonsGreen});
  })

  props.socket.on("receivedMessages", (...args: any) => {
    if (state.chatFocusId !== args[0].chatRefreshed - 1) {
      if (state.lstButtonsGreen.indexOf(args[0].chatRefreshed) < 0) {
        state.lstButtonsGreen.push(args[0].chatRefreshed);
        dispatch({type: "UPDATE_BUTTONS_GREEN", lstButtonsGreen: state.lstButtonsGreen});
      }
    } else {
      dispatch(
        {type: "UPDATE_DISPLAY",
        messages: args[0].messages,
        timeMessages: args[0].timeMessages,
        usernames: args[0].usernames,
      });
    }
  })

  props.socket.on("errorMessage", (...args: any) => {
    dispatch({
      type: "SET_ERROR_DISPLAY_TRUE",
      errorMessage: args[0].errorMessage,
    });
    setTimeout(() => {
      dispatch({ type: "SET_ERROR_DISPLAY_FALSE" });
    }, 5000);
  });

  props.socket.on("redirectToInviteProfile", (...args: any) => {
    let h = window.history;
    h.pushState({ "showGameOptions": true }, "", "/userView/:" + args[0].usernameToRedirect);
    h.go(0);
  });


  useEffect(() => {
    const controller = new AbortController();
    if (!state.load) {
      fetch(url, {
        method: "get",
        credentials: "include",
        signal: controller.signal,
      })
      .then(res => {
        if (res.status === 404) {
          return (undefined);
        }
        else if (res.status === 403)
          window.location.assign(DISCONNECTING_URL);
        else
          return (res.json());
      })
      .then(
        (res) => {
          if (res === undefined)
            return;
          if (res["code"] === "e2300")
            return;
          let tmpArray: number[] = [];
          for (let i = 0; i < res.length; i++) {
            tmpArray.push(res[i].id);
          }
          tmpArray.sort();
          dispatch({type: "CHANGE_LIST_ID_LOAD", load: true, lstId: tmpArray});
          props.socket.emit("fetchMessages", {chatId: state.chatFocusId + 1, username: props.name});
        },
        (error) => {}
      )
    } else if (state.refresh) {
      props.socket.emit("fetchMessages", {chatId: state.chatFocusId + 1, username: props.name});
      dispatch({type: "FRESH_FALSE"});
    }
    return () => {
      controller.abort();
    }
  }, [state, url, props.socket, props.name]);

  // autoscroll down on msg receive :
  var chatWindow = document.getElementById('txtWrap');
  chatWindow?.scrollTo(0, chatWindow?.scrollHeight);

  return (
    <div >
			<div id = "chatButtonTop">
      {state.lstId.length !== 0 &&
			<div style={{display: 'flex', margin:'auto', justifyContent:'center', alignItems: 'center', flexWrap: 'wrap'}}>
        	<IconButton size="large" onClick={() => {
            if (Date.now() - dateClick > 200) {
              props.socket.emit("createChat", {nameUser: props.name});
              setDateClick(Date.now());
            }
            }
          }
          >
          <AddBoxIcon sx={{ color:'white', fontSize: 28 }}/>
          </IconButton>
        <ChatCommandHelp />
      </div>}
      <DisplayButtonsChat
        state={state}
        dispatch={dispatch} />
      </div>
      <div id="txtWrap" >
      <ChatDisplay
        state={state}
        dispatch={dispatch}
        />
        {
          state.errorDisplay &&
          <ChatErrorMessage
            errorMessage={state.errorMessage}
          />
        }
      </div>
      <ChatInput
        socket={props.socket}
        state={state}
        dispatch={dispatch}
        username={props.name}
      />
    </div>
  );
}
