import React from "react";

interface ISearchBarInputProps {
  updateSearch: (input: string) => void,
  suggesting: boolean,
}

export default function SearchBarInput(props: ISearchBarInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    props.updateSearch(event.target.value);
  }
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    alert("LOL");
  }

  return(
    <form onSubmit={handleSubmit}>
      <label>
        <input type="text" onChange={handleChange} />
      </label>
    </form>
  );
}