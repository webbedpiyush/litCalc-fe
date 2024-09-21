import { useEffect, useRef, useState } from "react";
import { SWATCHES } from "@/colors";
import { Group } from "@mantine/core";
import { Button } from "@/components/ui/button";
import axios from "axios";

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

interface GeneratedResult {
  expression: string;
  answer: string;
}

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("rgb(255, 255, 255)");
  const [reset, setReset] = useState(false);
  const [result, setResult] = useState<GeneratedResult>();
  const [lotOfVars, setLotOfVars] = useState({});

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        context.lineCap = "round";
        context.lineWidth = 4;
      }
    }
  }, []);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.background = "black";
      const context = canvas.getContext("2d");
      if (context) {
        context.beginPath();
        context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.strokeStyle = color;
        context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        context.stroke();
      }
    }
  };

  const sendData = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const res = await axios({
        url: `${import.meta.env.VITE_API_URL}/calc`,
        data: {
          image: canvas.toDataURL("image/png"),
          dict_of_vars: lotOfVars,
        },
      });
      const data = await res.data;
      console.log("Response", data);
    }
  };

  return (
    <>
      <div className="grid grid-cols-[400px_auto_400px] gap-4 items-center">
        <Button
          onClick={() => setReset(true)}
          className="z-20 bg-black text-white font-semibold text-lg"
          variant="default"
          color="black"
        >
          Reset
        </Button>
        <Group className="z-20 space-x-1 flex justify-center items-center gap-2">
          {SWATCHES.map((Color: string) => (
            <button
              key={Color}
              style={{
                backgroundColor: Color,
                width: "40px",
                height: "40px",
                borderRadius: "50%",
              }}
              onClick={() => setColor(Color)}
            />
          ))}
        </Group>
        <Button
          onClick={sendData}
          className="z-20 bg-black text-white font-semibold text-lg"
          variant="default"
          color="black"
        >
          Calculate
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseOut={stopDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
      />
    </>
  );
}
