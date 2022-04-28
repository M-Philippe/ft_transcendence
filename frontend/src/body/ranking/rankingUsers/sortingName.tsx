export function sortingNameAscend(data: any[]) {
  for (let i = 0; i < data.length - 1; ++i) {
    for (let x = i + 1; x < data.length; ++x) {
      if (data[i].name > data[x].name) {
        let tmp = data[i];
        data[i] = data[x];
        data[x] = tmp;
      }
    }
  }
  return data;
}

export function sortingNameDescend(data: any[]) {
  for (let i = 0; i < data.length - 1; ++i) {
    for (let x = i + 1; x < data.length; ++x) {
      if (data[i].name < data[x].name) {
        let tmp = data[i];
        data[i] = data[x];
        data[x] = tmp;
      }
    }
  }
  return data;
}