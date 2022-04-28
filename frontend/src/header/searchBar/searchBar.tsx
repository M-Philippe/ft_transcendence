import React from "react";
import SearchBarInput from "./searchBarInput";
import SearchBarSuggestions from "./searchBarSuggestions";

interface ISearchBarProps {}

interface ISearchBarState {
  contentSearch: string,
  suggestions: boolean,
} 

export default class SearchBar extends React.Component<ISearchBarProps, ISearchBarState> {
  constructor(props: any) {
    super (props);

    this.state = {
      contentSearch: "",
      suggestions: false,
    }
  }

  updateContent = (input: string) => {
    this.setState({contentSearch: input});
    if (input === "search") {
      this.setState({
        contentSearch: input,
        suggestions: true,
      });
    }
    else if (this.state.suggestions && input !== "search") {
      this.setState({
        contentSearch: input,
        suggestions: false,
      });
    }
    else
      this.setState({
        contentSearch: input,
      });
  }

  render () {
    return (
    <div>
      <SearchBarInput
        updateSearch={this.updateContent}
        suggesting={this.state.suggestions}
      />
      {this.state.suggestions && <SearchBarSuggestions />}
    </div>
    );
  }
}