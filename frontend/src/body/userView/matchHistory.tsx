import { useEffect, useState } from "react";
import { API_MATCH_HISTORY, DISCONNECTING_URL } from "../../urlConstString";
import { Link, useLocation } from "react-router-dom";

interface IMatchHistory {
    opponent: string,
    winner: string,
    date: Date
}

function assembleMatchHistory(usernameFetched: string, matchHistory: IMatchHistory[]) {
    let ret: JSX.Element[] = [];
    let count = 0;
    for (let i = 0; i < matchHistory.length; i++) {
        ret.push(
            <div key={count++}>
                <span key={count++}>{usernameFetched} VS </span>
                <Link key={count++} to={"/userView/:" + matchHistory[i].opponent}>{matchHistory[i].opponent}</Link>
                <span key={count++} style={{color: matchHistory[i].winner === usernameFetched ? "green" : "red"}}>    {matchHistory[i].winner}</span>
            </div>
        );
    }
    return ret;
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
                {assembleMatchHistory(usernameToFetch, matchHistory)}
            </div>
        );
}