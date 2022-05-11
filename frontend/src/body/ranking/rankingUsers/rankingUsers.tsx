import React, { SetStateAction, useEffect, useState } from 'react';
import { sortingNameAscend, sortingNameDescend } from "./sortingName";
import { sortingWinAscend, sortingWinDescend } from "./sortingWin";
import { sortingLostAscend, sortingLostDescend } from "./sortingLost";
import { connect } from 'react-redux';
import { storeState } from '../../../store/types';
import { Link } from 'react-router-dom';
import trophee from '../../../styles/medias/trophee.png';

interface IRankingUsers {
  url: string;
}

function RankingUsers(props: any) {
  const [data, setData] = React.useState<Array<any>>([]);
  const [load, setLoad] = useState(false);
  const [sortNameAscend, setSortNameAscend] = useState(false);
  const [sortNameDescend, setSortNameDescend] = useState(false);
  const [sortWinAscend, setSortWinAscend] = useState(false);
  const [sortWinDescend, setSortWinDescend] = useState(false);
  const [sortLostAscend, setSortLostAscend] = useState(false);
  const [sortLostDescend, setSortLostDescend] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async (data: any[], setData: React.Dispatch<SetStateAction<any[]>>, url: string, signal: AbortSignal) => {
      let response: Response;
      try {
        response = await fetch(url, {signal: signal});
        if (!response.ok)
          return null;
        data = await response.json();
        setData(data);
        setLoad(true);
      } catch (error) { }
    } // loadData
    if (!load) {
      loadData(data, setData, props.url, controller.signal);
    }
    return () => {
      controller.abort();
    };
  }, [load, data, props.url]);

  if (data && sortNameAscend) {
    setSortNameAscend(false);
    setData(sortingNameAscend(data));
  } else if (data && sortNameDescend) {
    setSortNameDescend(false);
    setData(sortingNameDescend(data));
  } else if (data && sortWinAscend) {
    setSortWinAscend(false);
    setData(sortingWinAscend(data));
  } else if (data && sortWinDescend) {
    setSortWinDescend(false);
    setData(sortingWinDescend(data));
  } else if (data && sortLostAscend) {
    setSortLostAscend(false);
    setData(sortingLostAscend(data));
  } else if (data && sortLostDescend) {
    setSortLostDescend(false);
    setData(sortingLostDescend(data));
  }
  

  return (
      <table>
        <caption> <br/> <br/> <br/> <br/> <img id = "tropheeImg" src= {trophee} alt="Trophee"></img> <br/><br/> <b> Ranking Users </b> </caption>
        <thead>
          <tr>
            <th>
              <p className="nameHead">Name</p>
              <button onClick={() => {setSortNameAscend(true);}}>Up</button>
              <button onClick={() => {setSortNameDescend(true);}}>Down</button>
            </th>
            <th>
              <p>Win</p>
              <button onClick={() => {setSortWinAscend(true);}}>Up</button>
              <button onClick={() => {setSortWinDescend(true);}}>Down</button>
            </th>
            <th>
              <p>Lost</p>
              <button onClick={() => {setSortLostAscend(true);}}>Up</button>
              <button onClick={() => {setSortLostDescend(true);}}>Down</button>
            </th>
          </tr>
        </thead>
        <tbody>
            {data.length !== 0 &&
              data.map((element: any, index: number) => (
                <tr key={index}>
                  {
                    props.username === element.name &&
                    <th style={{background: "rgba(200, 200, 200, 0.7)"}}>
                      <Link
                        to={"/userView/:" + element.name}>
                          {element.name}
                      </Link>
                    </th>
                  }
                  {
                    props.username !== element.name &&
                    <th>
                      <Link
                        to={"/userView/:" + element.name}>
                          {element.name}
                      </Link>
                    </th>
                  }
                  <th>{element.wonCount}</th>
                  <th>{element.lostCount}</th>
                </tr>
              ))
            }
        </tbody>
      </table>
  );
}

function mapStateToProps(state: storeState, ownProps: IRankingUsers) {
  return ({
    username: state.user.username,
  });
}

export default connect(mapStateToProps)(RankingUsers);
