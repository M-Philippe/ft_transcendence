export interface UserAlert {
  socket: string,
  alert: {
    message: string,
    needResponse: boolean,
    requesterId: number,
    requesteeId: number,
    type: "friendships" | "achievements" | "invitationGame";
  }[]
}

export interface ChangePasswordDto {
  currentPassword: string,
	newPassword: string,
	confirmNewPassword: string,
}
