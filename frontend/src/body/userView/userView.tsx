import { useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_USER_VIEW, DISCONNECTING_URL } from "../../urlConstString";
import RelationshipsDisplay from "./relationshipsDisplay";
import InvitationGameQueryBox from "./invitationGameQueryBox";
import chooseRelationshipButton from "./chooseRelationshipButtons";
import { connect } from "react-redux";
import { storeState } from "../../store/types";
import { Link } from "react-router-dom";
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';


const AchievTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.black,
    color: 'rgba(255, 255, 255)',
    boxShadow: theme.shadows[1],
    fontSize: 15,
    marginTop: "-60px !important",
  },
}));

function achievementsTooltipMaker(achievement: string) {
  let ret : string;
  ret = " "
  if (achievement === "Worst Of The Best")
    ret = "Has been in the 10 best players.";
  if (achievement === "The Podium")
    ret = "Has been in the 3 best players.";
  if (achievement === "Above The Others")
    ret = "Has been THE BEST player.";
  return ret;
}

function assembleAchievements(achievements: any[]) {
  let retJsx = [];
  for (let i = 0; i < achievements.length; i++) {
    retJsx.push(
      <AchievTooltip title={achievementsTooltipMaker(achievements[i])} key={i}>
      <p style={{color:'black'}}>
        {achievements[i]}
      </p>
      </AchievTooltip>
    );
  }
  return (retJsx);
}

function UserView(props: {username: string, showGameOptions: boolean}) {
  const location = useLocation();
  const username = location.pathname.substr(location.pathname.indexOf(":") + 1);
  const url = API_USER_VIEW + username;
  const [refresh, setRefresh] = useState(0);

  const [openGameInvit, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  const [openFriend, setOpenFriend] = useState(false);
  const handleOpenFriend = () => setOpenFriend(true);
  const handleCloseFriend = () => setOpenFriend(false);

  const [openAchievements, setOpenAchievements] = useState(false);
  const handleOpenAchievements = () => setOpenAchievements(true);
  const handleCloseAchievements = () => setOpenAchievements(false);

  const [data, setData] = useState({
      name: "",
      avatar: "",
      lostCount: 0,
      wonCount: 0,
      inGame: false,
      online: false,
      relationshipStatus: "none",
      achievements: [],
    }
  );

  const [load, setLoad] = useState(false);

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
    setOpen(window.history.state.showGameOptions === undefined ? false : true);
    
    const controller = new AbortController();
    fetch(url, { credentials: "include", signal: controller.signal })
      .then(res => {
        if (res.status === 403)
          window.location.assign(DISCONNECTING_URL);
        return (res.json());
      })

      .then(
        (res) => {
          if (res["code"] === "e2300")
            return;
          setLoad(true);
          let tmp = {
            name: res["name"],
            avatar: res["avatar"],
            lostCount: res["lostCount"],
            wonCount: res["wonCount"],
            inGame: res["inGame"],
            online: res["online"],
            relationshipStatus: res["relationshipStatus"],
            achievements: res["achievements"],
          };
          //console.error(tmp.achievements);
          setData(tmp);
        },
        (error) => {}
      );

      return () => {
        controller.abort();
      }
  }, [url, refresh]);

  if (props.username === username) {
    return (
			<Navigate replace to="/myProfile" />
    );
  }

  if (load) {
    return (
      <div>
      <Stack direction="row" spacing={2}>
			<Typography variant="h6" noWrap sx={{border: 1, borderRadius: 2, margin:'auto', fontFamily: 'monospace', 
				fontWeight: 700, color: 'white', }}	>
				&nbsp;{data.name}&nbsp;
			</Typography>
			</Stack><br />
        <img id = "avatarMyProfil" src={data.avatar} alt="Avatar"/>
      <Stack margin="auto" sx={{ width: '35%', }} spacing={2}>
        {
          (data.inGame &&
          <b><p style={{color:"#00FF00"}}>PLAYING</p></b>)
          ||
          ((
            data.online &&
            <b><p style={{color:"#00FF00"}}>ONLINE</p></b>
          )
          ||
          (
            !data.online &&
            <b><p style={{color:"#FF4500"}}>OFFLINE</p></b>
          ))
        }

        <p>Victory: {data.wonCount} &emsp;&emsp; Defeat: {data.lostCount}</p>
        {
          data.online &&
          <Button variant="contained" color="success" onClick={() => {handleOpen()}}>
            Invite to play a game</Button>
        }
      <Modal
        open={openGameInvit}
        onClose={handleClose}
      >
        <Box id ="inviteGamePopup" sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Choose your rules to play against :   
          </Typography>
          <Typography variant="subtitle1" id="modal-modal-description" sx={{ mt: 2, textAlign: 'center' }}>
        {
          data.online &&
          <InvitationGameQueryBox nameProfile={data.name} closePopUp={handleClose}/>
        }
          </Typography>
        </Box>
      </Modal>
        {data.achievements.length !== 0 && <Button variant="contained" onClick={() => {handleOpenAchievements()}}>
        <MilitaryTechIcon sx={{ color:'gold' }}/> <b>{data.achievements.length}</b> &nbsp;&nbsp;Achivements</Button> }
        <Modal
				open={openAchievements}
				onClose={handleCloseAchievements}
				>
				<Box sx={style}>
				<Typography id="modal-modal-title" variant="h5" sx={{borderBottom: 2, textAlign: 'center'}}>
				{data.name} achivements
				</Typography>
				<Typography id="modal-modal-description" variant="subtitle1" sx={{ mt: 2, textAlign: 'center' }}>
				{
          assembleAchievements(data.achievements)
				}
				</Typography>
				</Box>
				</Modal>
        {chooseRelationshipButton(data.relationshipStatus, data.name, setRefresh)}
        <Button variant="contained" onClick={() => {handleOpenFriend()}}>
           Friends list</Button>
        <Modal
				open={openFriend}
				onClose={handleCloseFriend}
				>
				<Box sx={style}>
				<Typography id="modal-modal-title" variant="h5" sx={{borderBottom: 2, textAlign: 'center'}}>
				{data.name} friends
				</Typography>
				<Typography id="modal-modal-description" variant="subtitle1" sx={{ mt: 2, textAlign: 'center' }}>
				{
          data.name !== "" && <RelationshipsDisplay nameProfile={data.name} />
				}
        <Button variant="contained" color="error" onClick={handleCloseFriend}>
					  Close
				</Button>
				</Typography>
				</Box>
				</Modal>
  			<Button component={Link} to="/matchHistory" variant="contained" color="info" state={{username: username}}>Match History</Button>
  			</Stack>
      </div>
    )
  }

  return(<div><p>Fetching User</p></div>);
}

function mapStateToProps(state: storeState, ownProps: {showGameOptions: boolean}) {
  return ({
    username: state.user.username,
    showGameOptions: ownProps.showGameOptions,
  });
}

export default connect(mapStateToProps)(UserView);
