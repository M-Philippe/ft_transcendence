interface ChatErrorMessageProps {
	errorMessage: string,
}

export default function ChatErrorMessage(props: ChatErrorMessageProps) {
  return (
    <div style={{display: 'inline'}}>
      <p style={{color: "white", backgroundColor: "black"}}>{props.errorMessage}</p>
    </div>
  );
}
