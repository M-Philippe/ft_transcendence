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
import { API_USER_LIST_CHAT, API_USER_VIEW, DISCONNECTING_URL } from "../../../urlConstString";
import AddBoxIcon from '@mui/icons-material/AddBox';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import InvitationGameQueryBox from "../../userView/invitationGameQueryBox";
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

interface PropsChatConnected {
  name: string,
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
}

interface ILstId {
  id: number,
  name: string,
}

export type State = {
  messages: string[];
  timeMessages: string[];
  usernames: string[];
  lstId: ILstId[];
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
  lstId?: ILstId[];
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
    case "REFRESH_FALSE":
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

function findIndexLstId(lstId: ILstId[], idtoFind: number) {
  let count = 0;
  while (count < lstId.length) {
    if (lstId[count].id === idtoFind)
      return count;
    count++;
  }
  return -1;
}

export function ChatConnected(props: PropsChatConnected) {
  const url = API_USER_LIST_CHAT + props.name;

  const [openGameInvit, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [data, setData] = useState({
    name: "",
    online: false,
  }
);

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
  props.socket.off("receivedListChat");
  props.socket.off("updateChatName");
  props.socket.off("focusOnmp");


  props.socket.on("focusOnpm", (...args: any) => {
    dispatch({ type: "UPDATE_FOCUS_AND_REMOVE_GREEN", 
    chatFocusId: args[0].chatFocusId - 1,
    lstButtonsGreen: state.lstButtonsGreen
    });
    state.chatFocusId = args[0].chatFocusId - 1;
  });

  props.socket.on("removeChat", (...args: any) => {
    if (state.lstButtonsGreen.indexOf(args[0].oldIdChat) >= 0)
      state.lstButtonsGreen.splice(state.lstButtonsGreen.indexOf(args[0].oldIdChat));
    if (args[0].oldIdChat !== -1)
      state.lstId.splice(findIndexLstId(state.lstId, args[0].oldIdChat), 1);
    dispatch({
      type: "UPDATE_LST_ID_AND_CHAT_AND_FOCUS",
      lstId: state.lstId,
      messages: args[0].newMessages,
      timeMessages: args[0].newTimeMessages,
      usernames: args[0].newUsernames,
      chatFocusId: args[0].newChatId - 1,
      lstButtonsGreen: state.lstButtonsGreen,
    });
  });

  props.socket.on("updateChatName", (...args: any) => {
    let idx = findIndexLstId(state.lstId, args[0].id);
    if (idx < 0)
      return;
    state.lstId[idx].name = args[0].name;
    dispatch({ type: "CHANGE_LST_ID", lstId: state.lstId });
  });

  props.socket.on("newChat", (...args: any) => {
    if (findIndexLstId(state.lstId, args[0].newChatId) >= 0)
      return;
    let tmp = state.lstId;
    tmp.push({id: args[0].newChatId, name: args[0].name });
    tmp.sort(function(a, b){return a.id - b.id});
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
    let urlInvite = API_USER_VIEW + args[0].usernameToRedirect;
    fetch(urlInvite, { credentials: "include" })
      .then(res => {
        if (res.status === 403)
          window.location.assign(DISCONNECTING_URL);
        return (res.json());
      })
      .then(
        (res) => {
          if (res["code"] === "e2300")
            return;
          let tmp = {
            name: res["name"],
            online: res["online"],
          };
          setData(tmp);
        }
      );
      handleOpen();
  });

  props.socket.on("receivedListChat", (...args: any) => {
    dispatch({type: "CHANGE_LIST_ID_LOAD", load: true, lstId: args[0].lstId});
  })


  useEffect(() => {
    if (!state.load) {
      props.socket.emit("getListChat");
      props.socket.emit("fetchMessages", {chatId: 1});
      dispatch({type: "CHANGE_LIST_ID_LOAD", load: true, lstId: [{id: 1, name: "general"}]});
    }
    if (state.refresh) {
      props.socket.emit("fetchMessages", {chatId: state.chatFocusId + 1});
      dispatch({type: "REFRESH_FALSE"});
    }

    var chatWindow = document.getElementById('txtWrap');
    chatWindow?.scrollTo({
    top: chatWindow.scrollHeight,
    behavior: 'smooth'
    })
    
  }, [state, url, props.socket, props.name]);


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

  const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.white,
      color: 'rgba(0, 0, 0, 0.87)',
      boxShadow: theme.shadows[1],
      fontSize: 15,
      marginTop: "-60px !important",
    },
  }));


  return (
    <div >
      <Modal
        open={openGameInvit}
        onClose={handleClose}
      >
        <Box id ="inviteGamePopup" sx={style}>
          { 
            data.online &&
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Choose your rules to play against :   
            </Typography>
          }
          <Typography variant="subtitle1" id="modal-modal-description" sx={{ mt: 2, textAlign: 'center' }}>
        {
          data.online &&
          <InvitationGameQueryBox nameProfile={data.name} closePopUp={handleClose}/>
        }
          </Typography>
        { !data.online && <p className="errorMessage"> {data.name} is not connected. </p> }
        </Box>
      </Modal>
			<div id = "chatButtonTop">
      {state.lstId.length !== 0 &&
			<div style={{display: 'flex', justifyContent:'center', alignItems: 'center', flexWrap: 'wrap'}}>
        <LightTooltip title="New channel" enterNextDelay={500}>
        	<IconButton onClick={() => {
            if (Date.now() - dateClick > 200) {
              props.socket.emit("createChat", {nameUser: props.name});
              setDateClick(Date.now());}
            }
          }
          >
          <AddBoxIcon sx={{ color:'white', fontSize: 27 }}/>
          </IconButton>
          </LightTooltip>
        <LightTooltip title="Delete channel" enterNextDelay={500}>
          <IconButton onClick={() => {
              props.socket.emit("postMessage", {id: state.chatFocusId +1, username: null, message: "/quit"});}}>
          <DeleteForeverIcon sx={{ color:'white', fontSize: 28 }}/>
          </IconButton>
          </LightTooltip>
        <ChatCommandHelp />
      </div>}
      <DisplayButtonsChat
        state={state}
        dispatch={dispatch} />
      </div>
      <div id="txtWrap" >
      <br/>
      <ChatDisplay
        socket={props.socket}
        username={props.name}
        state={state}
        // dispatch={dispatch}
        />
        {
          state.errorDisplay &&
          <ChatErrorMessage
            errorMessage={state.errorMessage}
          />
        }
      <ChatInput
        socket={props.socket}
        state={state}
        dispatch={dispatch}
        username={props.name}
        />
        </div>
    </div>
  );
}
