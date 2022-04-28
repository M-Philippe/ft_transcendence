export function sortingWinAscend(data: any[]) {
  for (let i = 0; i < data.length - 1; ++i) {
    for (let x = i + 1; x < data.length; ++x) {
      if (data[i].wonCount > data[x].wonCount) {
        let tmp = data[i];
        data[i] = data[x];
        data[x] = tmp;
      }
    }
  }
  return data;
}

export function sortingWinDescend(data: any[]) {
  for (let i = 0; i < data.length - 1; ++i) {
    for (let x = i + 1; x < data.length; ++x) {
      if (data[i].wonCount < data[x].wonCount) {
        let tmp = data[i];
        data[i] = data[x];
        data[x] = tmp;
      }
    }
  }
  return data;
}