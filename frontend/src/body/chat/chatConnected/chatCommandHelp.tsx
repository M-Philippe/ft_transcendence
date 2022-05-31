import { useState } from "react";
import '../../../styles/chat.css';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

export default function ChatCommandHelp (props: any) {
  const [displayText, setDisplayText] = useState(false);

  function handleMouseEnter(e: React.MouseEvent<HTMLParagraphElement, MouseEvent>) {
    setDisplayText(true);
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLParagraphElement, MouseEvent>) {
    setDisplayText(false);
  }

  return (
      <div style={{display:'inline'}} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}> 
        <QuestionMarkIcon sx={{ color:'white', fontSize: 25 }} />
      {displayText &&
        <div id="chatCmdHelp" style={{borderRadius:'10px', backgroundColor: "white", color:'black', position:'absolute', right:'8%', minWidth:'25%' , zIndex:1}}>
          <b><p>&emsp;User commands :</p></b>
          <p>Invite: "/invite &lt;user&gt;"</p>
          <p>Mute: "/mute &lt;user&gt;"</p>
          <p>Mute: "/mute &lt;user&gt; &lt;time&gt; &lt;m or s&gt;"</p>
          <p>Unmute: "/unmute &lt;user&gt;"</p>
          <p>Private Message: "/mp &lt;user&gt;"</p>
          <p>Quit: "/quit"</p>
          <p>Game: "/game &lt;user&gt;"</p>
          <b><p>&emsp;Admin commands :</p></b>
          <p>Ban: "/ban &lt;user&gt;"</p>
          <p>Ban: "/Ban &lt;user&gt; &lt;time&gt; &lt;h or s&gt;"</p>
          <b><p>&emsp;Owner commands :</p></b>
          <p>chatPublic: "/setChatPublic"</p>
          <p>chatPrivate: "/setChatPrivate"</p>
          <p>password: "/setPassword &lt;password&gt;"</p>
          <p>unsetpassword: "/unsetPassword"</p>
          <p>Admin: "/addAdmin &lt;user&gt;"</p>
          <p>Unadmin: "/removeAdmin &lt;user&gt;"</p>
          <br/>
        </div>
      }
      </div>
  );
}
