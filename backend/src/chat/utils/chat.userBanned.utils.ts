import { Banned } from "../chat.interface";

export function isUserBanned(bannedUsers: Array<Banned>, userIdToFind: number) : boolean {
	if ((bannedUsers.find(o => o.userId === userIdToFind)) !== undefined)
	  return (true);
	return (false);
  }

export function getIndexBannedUser(bannedUsers: Array<Banned>, userIdToFind: number) {
	for (let i = 0; i < bannedUsers.length; i++) {
	  if (bannedUsers[i].userId === userIdToFind) {
		return (i);
	  }
	}
	return (-1);
  }
