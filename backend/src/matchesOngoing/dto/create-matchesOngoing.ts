export class CreateMatchOngoingDto {
  public id!: number;
  public pending: boolean;
  public palletAX: number;
  public palletAY: number;
  public palletBX: number;
  public palletBY: number;
  public puckX: number;
  public puckY: number;
}