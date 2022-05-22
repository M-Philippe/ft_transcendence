import { useEffect, useState } from "react";
import { API_USER_GAME_INFOS, DISCONNECTING_URL } from "../../urlConstString";

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

  if (load) {
    return (
      <div>
        <p>Victory: {data.wonCount} &emsp;&emsp; Defeat: {data.lostCount}</p>
        {
          assembleAchievements(data.achievements)
        }
      </div>
    );
  }

  return (null);
}