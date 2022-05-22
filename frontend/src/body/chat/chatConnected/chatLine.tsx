import { Link } from "react-router-dom"

interface IChatLineProps {
  key: number,
  username: string,
  timeMessage: string,
  message: string,
}

export default function ChatLine(props: IChatLineProps) {
  let pathLink = "/userView/:" + props.username;

  return (
      <p>
          <Link to={pathLink} style={{display:"inline", textDecoration:"none"}}>{props.username} </Link>
          - {props.timeMessage}
        <br />
        {props.message}
      </p>
  );
}
