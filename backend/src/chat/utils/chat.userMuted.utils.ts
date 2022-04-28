import { Muted } from "../chat.interface";

export function isUserMuted(mutedUsers: Array<Muted>, userIdToFind: number) : boolean {
	if ((mutedUsers.find(o => o.userId === userIdToFind)) !== undefined)
	  return (true);
	return (false);
  }

export function getIndexMutedUser(mutedUsers: Array<Muted>, userIdToFind: number) {
	for (let i = 0; i < mutedUsers.length; i++) {
	  if (mutedUsers[i].userId === userIdToFind) {
		return (i);
	  }
	}
	return (-1);
  }
