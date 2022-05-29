import React, { useEffect, useRef } from 'react';

export const canvasWidth = window.innerWidth * .2;
export const canvasHeight = window.innerHeight * .6;

export interface BoardPositions {
  idGame: number,
	palletAX: number;
  palletAY: number;
	palletL: number;
	palletAHeight: number;
  palletBX: number;
  palletBY: number;
	palletBHeight: number;
  speedPalet: number;
	puckX: number;
  puckY: number;
  puckR: number;
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
  powerUpL: number;
  hasMessageToDisplay: boolean;
  messageToDisplay: string;
  powerUpState: boolean;
  powerUpGenerate: boolean;
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2, false);
  ctx.closePath();
  ctx.fill();
}

export function draw(ctx: CanvasRenderingContext2D | null, coordinates: BoardPositions) {
  if (ctx == null)
    return;

  ctx.fillStyle = coordinates.objectColor;
  // pallet
  ctx.fillRect(coordinates.palletAX, coordinates.palletAY, coordinates.palletL, coordinates.palletAHeight);
  ctx.fillRect(coordinates.palletBX, coordinates.palletBY, coordinates.palletL, coordinates.palletBHeight);
  // puck
  if (!(coordinates.powerUpGenerate && coordinates.powerUpState && coordinates.powerUpInvisible)) {
    drawCircle(ctx, coordinates.puckX, coordinates.puckY, coordinates.puckR, coordinates.objectColor);
  }
  // middle line
  ctx.fillRect(coordinates.width / 2, 0, 1, coordinates.height);

  // Text
  ctx.font = "30px Arial";
  ctx.fillText(coordinates.scoreA.toString(), 30, 30);
  ctx.fillText(coordinates.scoreB.toString(), coordinates.width - 30, 30);
  // PowerUpFilling
  if (coordinates.powerUpGenerate) {
    if (coordinates.powerUpState) {
      ctx.fillRect(coordinates.powerUpX, coordinates.powerUpY, coordinates.powerUpL, coordinates.powerUpL);
      if (coordinates.powerUpInvisible) {
        ctx.textAlign = "center";
        ctx.fillStyle = coordinates.backgroundColor;
        ctx.fillText("I", coordinates.powerUpX + (coordinates.powerUpL / 2), (coordinates.powerUpY + (coordinates.powerUpL / 2) + 10));
      } else if (coordinates.powerUpShrink) {
        ctx.textAlign = "center";
        ctx.fillStyle = coordinates.backgroundColor;
        ctx.fillText("S", coordinates.powerUpX + (coordinates.powerUpL / 2), (coordinates.powerUpY + (coordinates.powerUpL / 2) + 10));
      }
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
    idGame: 0,
    palletAX: 0,
    palletAY: 0,
    palletL: 0,
    palletAHeight: 0,
    palletBX: 0,
    palletBY: 0,
    palletBHeight: 0,
    speedPalet: 0,
    puckX: 0,
    puckY: 0,
    puckR: 0,
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
    powerUpL: 0,
    hasMessageToDisplay: false,
    messageToDisplay: "",
    powerUpState: false,
    powerUpGenerate: false,
  });

  useEffect(() => {
    const canvasObj = canvasRef.current;
    if (canvasObj == null) {
      //console.log("CanvasObj NULL");
      return;
    }
    const ctx = canvasObj.getContext("2d");
    if (ctx == null)
      return;
    ctx.fillStyle = coordinates.backgroundColor;
    ctx.fillRect(0, 0, coordinates.width, coordinates.height);
    draw(ctx, coordinates);
  });

  return [coordinates, setCoordinates, canvasRef] as const;
}
