import { Users } from "../chat.interface";

export function isUserPresent(users: Array<Users>, userIdToFind: number) : boolean {
	if ((users.find(o => o.userId === userIdToFind)) !== undefined)
	  return (true);
	return (false);
  }

export function getIndexUser(users: Array<Users>, userIdToFind: number) {
	for (let i = 0; i < users.length; i++) {
		if (users[i].userId === userIdToFind) {
			return (i);
	  }
	}
	return (-1);
  }
