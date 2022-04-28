export function sortingLostAscend(data: any[]) {
  for (let i = 0; i < data.length - 1; ++i) {
    for (let x = i + 1; x < data.length; ++x) {
      if (data[i].lostCount > data[x].lostCount) {
        let tmp = data[i];
        data[i] = data[x];
        data[x] = tmp;
      }
    }
  }
  return data;
}

export function sortingLostDescend(data: any[]) {
  for (let i = 0; i < data.length - 1; ++i) {
    for (let x = i + 1; x < data.length; ++x) {
      if (data[i].lostCount < data[x].lostCount) {
        let tmp = data[i];
        data[i] = data[x];
        data[x] = tmp;
      }
    }
  }
  return data;
}