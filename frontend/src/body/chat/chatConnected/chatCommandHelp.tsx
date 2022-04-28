import { useState } from "react";


export default function ChatCommandHelp (props: any) {
  const [displayText, setDisplayText] = useState(false);

  function handleMouseEnter(e: React.MouseEvent<HTMLParagraphElement, MouseEvent>) {
    setDisplayText(true);
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLParagraphElement, MouseEvent>) {
    setDisplayText(false);
  }

  return (
    <span style={{display:'inline'}}>
      <p style={{display:'inline'}} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>  ?</p>
      {displayText &&
        <div style={{backgroundColor: "black", color:"white", position:'absolute', zIndex:100}}>
          <p>&emsp;UserCommand</p>
          <p>Mute: "/mute &lt;user&gt;"</p>
          <p>Mute: "/mute &lt;user&gt; &lt;time&gt; &lt;m or s&gt;"</p>
          <p>Unmute: "/unmute &lt;user&gt;"</p>
          <p>Private Message: "/mp &lt;user&gt;"</p>
          <p>Quit: "/quit"</p>
          <p>&emsp;AdminCommand</p>
          <p>chatPublic: "/setChatPublic"</p>
          <p>chatPrivate: "/setChatPrivate"</p>
          <p>password: "/setPassword &lt;password&gt;"</p>
          <p>unsetpassword: "/unsetPassword"</p>
          <p>Ban: "/ban &lt;user&gt;"</p>
          <p>Ban: "/Ban &lt;user&gt; &lt;time&gt; &lt;h or s&gt;"</p>
        </div>
      }
    </span>
  );
}
