interface ChatErrorMessageProps {
	errorMessage: string,
}

export default function ChatErrorMessage(props: ChatErrorMessageProps) {
  return (
    <div style={{display: 'inline'}}>
      <p className="errorMessage">{props.errorMessage}</p>
    </div>
  );
}
