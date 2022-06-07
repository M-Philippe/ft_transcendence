import { useEffect, useState } from "react";
import { API_MATCH_HISTORY, DISCONNECTING_URL } from "../../urlConstString";
import { Link, useLocation } from "react-router-dom";
import HistoryIcon from '@mui/icons-material/History';
import { Stack } from "@mui/material";
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface IMatchHistory {
    opponent: string,
    winner: string,
    date: Date
}

function assembleMatchHistory(usernameFetched: string, matchHistory: IMatchHistory[]) {
    let retJsx = [];
    let count = 0;
    for (let i = 0; i < matchHistory.length; i++) {
        retJsx.push(
            <div key={count++} style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>
                {matchHistory[i].winner === usernameFetched ? <EmojiEventsIcon sx={{color:'gold', fontSize: 35 }} />: <CloseIcon color="error" sx={{ fontSize: 35 }} />}&nbsp; 
                {usernameFetched} VS &nbsp; 
                {<Link key={count++} to={"/userView/:" + matchHistory[i].opponent}>{matchHistory[i].opponent}</Link>}&nbsp;
                {matchHistory[i].winner === matchHistory[i].opponent ? <EmojiEventsIcon sx={{ color:'gold', fontSize: 35 }} />: <CloseIcon color="error" sx={{ fontSize: 35 }} />}
            </div>
        );
    }
    return retJsx;
}

export default function MatchHistory(props: any) {
    const routeState = useLocation().state as { username: string};
    const usernameToFetch = routeState.username;
    //console.log("FETCHED: [", usernameToFetch.trim(), "]");
    const [errorMessage, setErrorMessage] = useState("");
    const [matchHistory, setMatchHistory] = useState<Array<IMatchHistory> | undefined>(undefined);
    const [load, setLoad] = useState(true);

    useEffect(() => {
        if (load) {
        fetch(API_MATCH_HISTORY + "/" + usernameToFetch, {
            method: "GET",
            credentials: "include",
        })
        .then(async res => {
            let payload = await res.json();
            if (res.status === 403) {
                window.location.assign(DISCONNECTING_URL);
            } else if (res.status === 404) {
                setErrorMessage(payload.errorMessage);
            } else {
                setMatchHistory(payload);
            }
            setLoad(false);
        })
        .catch(error => { setErrorMessage("Error server. Please refresh the page.") });
        }
    });

    if (errorMessage !== "")
        return (
            <div>
                <p className="errorMessage">{errorMessage}</p>    
            </div>
        );
    else if (matchHistory === undefined)
        return (
            <div>
                <p>Fetching Data.</p>
            </div>
        );
    else if (matchHistory.length === 0)
        return (
            <div>
                <p>This player hasn't played a game yet.</p>
            </div>
        );
    else 
        return (
            <div>
            <Stack direction="row" sx={{margin:'auto',}} spacing={2}>
			<Typography variant="h6" sx={{margin:'auto', color: 'white', }}	>
                  <HistoryIcon sx={{ fontSize: 80 }}/>
			</Typography>
			</Stack><br />
      		<Stack margin="auto" sx={{ width: '35%', textAlign:'center',}} spacing={2}>
              <Typography variant="h6" sx={{margin:'auto', fontFamily: 'monospace', 
				fontWeight: 700, color: 'white',}}	>
                {matchHistory.length} Matchs played :{<br/>}{<br/>}
                {assembleMatchHistory(usernameToFetch, matchHistory)}
			</Typography>

            </Stack>
            </div>
        );
}