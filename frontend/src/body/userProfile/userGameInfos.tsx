import { useEffect, useState } from "react";
import { API_USER_GAME_INFOS, DISCONNECTING_URL } from "../../urlConstString";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

function assembleAchievements(achievements: any[]) {
	let retJsx = [];
	for (let i = 0; i < achievements.length; i++) {
	  retJsx.push(
		<p style={{color:'black'}} key={i}>
		  {achievements[i]}
		</p>
	  );
	}
	return (retJsx);
  }

export default function UserGameInfos(props: any) {
	const [openAchievements, setOpenAchievements] = useState(false);
	const handleOpenAchievements = () => setOpenAchievements(true);
	const handleCloseAchievements = () => setOpenAchievements(false);
  const [data, setData] =
    useState<{ wonCount: number, lostCount: number, achievements: string[]}>
    ({ wonCount: 0, lostCount: 0, achievements: [] });
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (!load) {
      fetch(API_USER_GAME_INFOS, { credentials: "include" })
      .then(async res => {
        if (res.status === 403)
          window.location.assign(DISCONNECTING_URL);
        else if (res.status === 200) {
          let payload = await res.json();
          setData(payload);
        }
        setLoad(true);
      })
    }
  });

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

  if (load) {
    return (
      <div>
        <p>Victory: {data.wonCount} &emsp;&emsp; Defeat: {data.lostCount}</p>
        			{data.achievements.length !== 0 && <Button variant="contained" onClick={() => {handleOpenAchievements()}}>
			<b>{data.achievements.length}</b> &nbsp;&nbsp;Achivements</Button> }
			<Modal
			open={openAchievements}
			onClose={handleCloseAchievements}
			>
			<Box sx={style}>
			<Typography id="modal-modal-title" variant="h5" sx={{borderBottom: 2, textAlign: 'center'}}>
			 your achivements
			</Typography>
			<Typography id="modal-modal-description" variant="subtitle1" sx={{ mt: 2, textAlign: 'center' }}>
			{
        assembleAchievements(data.achievements)
			}
			</Typography>
			</Box>
			</Modal>
        {
        }
      </div>
    );
  }

  return (null);
}