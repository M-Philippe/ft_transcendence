import React, { useEffect, useRef } from 'react';

export const canvasWidth = window.innerWidth * .2;
export const canvasHeight = window.innerHeight * .6;

export interface BoardPositions {
	palletAX: number;
  palletAY: number;
	palletAWidth: number;
	palletAHeight: number;
  palletBX: number;
  palletBY: number;
	palletBWidth: number;
	palletBHeight: number;
  speedPalet: number;
	puckX: number;
  puckY: number;
  puckWidth: number;
  puckHeight: number;
	width: number;
	height: number;
  scoreA: number,
  scoreB: number,
  backgroundColor: string,
  objectColor: string,
  powerUpInvisible: boolean;
  powerUpShrink: boolean;
  powerUpX: number;
  powerUpY: number;
  powerUpWidth: number;
  powerUpHeight: number;
  hasMessageToDisplay: boolean;
  messageToDisplay: string;
  powerUpState: number;
}

export function draw(ctx: CanvasRenderingContext2D | null, coordinates: BoardPositions) {
  if (ctx == null)
    return;

  // console.log("PowerUp State: ", coordinates.powerUpState, coordinates.powerUpInvisible === true ? " (invisible)" : " (shrink)");
  // first racket
  ctx.fillStyle = coordinates.objectColor;
  ctx.fillRect(coordinates.palletAX, coordinates.palletAY, coordinates.palletAWidth, coordinates.palletAHeight);
  // second racket
  ctx.fillRect(coordinates.palletBX, coordinates.palletBY, coordinates.palletBWidth, coordinates.palletBHeight);
  // puck
  if (coordinates.powerUpShrink || (coordinates.powerUpInvisible && coordinates.powerUpState !== 1) || coordinates.powerUpState === -1)
    ctx.fillRect(coordinates.puckX, coordinates.puckY, coordinates.puckWidth, coordinates.puckHeight);
  // middle line
  ctx.fillRect(coordinates.width / 2, 0, 1, coordinates.height);
  // PowerUpFilling
  if (coordinates.powerUpState === 0)
    ctx.fillRect(coordinates.powerUpX, coordinates.powerUpY, coordinates.powerUpWidth, coordinates.powerUpHeight);

  // Text
  ctx.font = "30px Arial";
  ctx.fillText(coordinates.scoreA.toString(), 30, 30);
  ctx.fillText(coordinates.scoreB.toString(), coordinates.width - 30, 30);
  if (coordinates.powerUpState === 0) {
    if ( coordinates.powerUpInvisible) {
      ctx.textAlign = "center";
      ctx.fillStyle = coordinates.backgroundColor;
      ctx.fillText("I", coordinates.powerUpX + (coordinates.powerUpWidth / 2), (coordinates.powerUpY + (coordinates.powerUpHeight / 2) + 10));
    } else if (coordinates.powerUpShrink) {
      ctx.textAlign = "center";
      ctx.fillStyle = coordinates.backgroundColor;
      ctx.fillText("S", coordinates.powerUpX + (coordinates.powerUpWidth / 2), (coordinates.powerUpY + (coordinates.powerUpHeight / 2) + 10));
    }
  }
  if (coordinates.hasMessageToDisplay) {
    ctx.fillStyle = "green";
    ctx.textAlign = "center";
    ctx.fillText(coordinates.messageToDisplay, 250, 200);
  }
}

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [coordinates, setCoordinates] = React.useState<BoardPositions>({
    palletAX: 0,
    palletAY: 0,
    palletAWidth: 0,
    palletAHeight: 0,
    palletBX: 0,
    palletBY: 0,
    palletBWidth: 0,
    palletBHeight: 0,
    speedPalet: 0,
    puckX: 0,
    puckY: 0,
    puckWidth: 0,
    puckHeight: 0,
    width: 0,
    height: 0,
    scoreA: 0,
    scoreB: 0,
    backgroundColor: "black",
    objectColor: "white",
    powerUpInvisible: false,
    powerUpShrink: false,
    powerUpX: 0,
    powerUpY: 0,
    powerUpWidth: 0,
    powerUpHeight: 0,
    hasMessageToDisplay: false,
    messageToDisplay: "",
    powerUpState: 0,
  });

  useEffect(() => {
    const canvasObj = canvasRef.current;
    if (canvasObj == null) {
      //console.log("CanvasObj NULL");
      return;
    }
    const ctx = canvasObj.getContext("2d");
    if (ctx == null) {
      console.log("Ctx NULL");
      return;
    }
    ctx.fillStyle = coordinates.backgroundColor;
    ctx.fillRect(0, 0, coordinates.width, coordinates.height);
    draw(ctx, coordinates);
  });

  return [coordinates, setCoordinates, canvasRef] as const;
}
