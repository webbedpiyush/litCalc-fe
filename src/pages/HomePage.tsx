import { useCallback, useEffect, useRef, useState } from "react";
import { SWATCHES } from "@/colors";
import { Group } from "@mantine/core";
import { Button } from "@/components/ui/button";
import Draggable from "react-draggable";
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
  const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 100 });
  const [lotOfVars, setLotOfVars] = useState({});

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]);
      setResult(undefined);
      setLotOfVars({});
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    if (latexExpression.length > 0 && window.MathJax) {
      setTimeout(() => {
        if (typeof window.MathJax !== "undefined") {
          window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
        }
      }, 0);
    }
  }, [latexExpression]);
  const renderLatexToCanvas = useCallback(
    (expression: string, answer: string) => {
      const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
      setLatexExpression((prevLatex) => [...prevLatex, latex]); // Use functional update for state

      // Clear the main canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    },
    [canvasRef] // List of dependencies
  );

  useEffect(() => {
    if (result) {
      console.log(result.expression, result.answer);
      renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result, renderLatexToCanvas]);

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

    // const script = document.createElement("script");
    // script.src =
    //   "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/config/TeX-MML-AM_CHTML.js";
    // script.async = true;
    // document.head.appendChild(script);

    if (window.MathJax) {
      window.MathJax.Hub.Config({
        tex2jax: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
        },
      });
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
        method: "post",
        url: `${import.meta.env.VITE_API_URL}/calc`,
        data: {
          image: canvas.toDataURL("image/png"),
          dict_of_vars: lotOfVars,
        },
      });
      const resp = await res.data;
      console.log("Response", resp);
      if (resp.message === "Image processed") {
        // Parse the string data to convert it into an array of objects
        const parsedData = JSON.parse(resp.data.replace(/'/g, '"'));
        console.log(parsedData);
        parsedData.forEach((data: Response) => {
          if (data.assign === true) {
            setLotOfVars((prevVars) => ({
              ...prevVars,
              [data.expr]: data.result,
            }));
            console.log(lotOfVars);
          }
        });
      }
      const context = canvas.getContext("2d");
      const imageData = context!.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (imageData.data[i + 3] > 0) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setLatexPosition({ x: centerX, y: centerY });
      if (resp.message === "Image processed") {
        // Parse the string data to convert it into an array of objects
        const parsedData = JSON.parse(resp.data.replace(/'/g, '"'));
        console.log(parsedData);
        parsedData.forEach((data: Response) => {
          // if (data.assign === true) {
          setTimeout(() => {
            setResult((prevResult) => ({
              ...prevResult, // Maintain any previous result properties
              expression: data.expr,
              answer: data.result,
            }));
          }, 1000);
          console.log(result);
          // }
        });
      }
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
      {latexExpression &&
        latexExpression.map((latex, index) => (
          <Draggable
            key={index}
            defaultPosition={latexPosition}
            onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
          >
            <div className="absolute p-2 text-white rounded shadow-md">
              <div className="latex-content">{latex}</div>
            </div>
          </Draggable>
        ))}
    </>
  );
}
