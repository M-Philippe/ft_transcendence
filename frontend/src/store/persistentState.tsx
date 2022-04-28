export const saveState = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("state", serializedState);
  } catch(err) {
    console.log(err);
  }
};

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem("state");
    if (!serializedState)
      return undefined;
    else return JSON.parse(serializedState);
  } catch(err) {
    return undefined;
  }
};
