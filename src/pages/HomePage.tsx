import { useCallback, useEffect, useRef, useState } from "react";
import { SWATCHES } from "@/colors";
import { Group } from "@mantine/core";
import { Button } from "@/components/ui/button";
import Draggable from "react-draggable";
import axios from "axios";
import { Link } from "react-router-dom";

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
      window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
    }
  }, [latexExpression]);

  const renderLatexToCanvas = useCallback(
    (expression: string, answer: string) => {
      const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;

      // const latex = `\\(${answer}\\)`;
      setLatexExpression((prevLatex) => [...prevLatex, latex]);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    },
    [canvasRef]
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
  }, []);

  useEffect(() => {
    const loadMathJax = () => {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/latest.js?config=TeX-MML-AM_CHTML";
      script.async = true;
      script.onload = () => {
        if (window.MathJax) {
          window.MathJax.Hub.Config({
            tex2jax: {
              inlineMath: [
                ["$", "$"],
                ["\\(", "\\)"],
              ],
            },
          });
          window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
        }
      };
      document.head.appendChild(script);
    };

    loadMathJax();
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
        const parsedData = JSON.parse(resp.data.replace(/'/g, '"'));
        console.log(parsedData);
        parsedData.forEach((data: Response) => {
          setTimeout(() => {
            setResult((prevResult) => ({
              ...prevResult,
              expression: data.expr,
              answer: data.result,
            }));
          }, 1000);
          console.log(result);
        });
      }
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-center p-2 bg-black ">
        <Button
          onClick={() => setReset(true)}
          className="z-20 h-10 px-4 py-2 bg-red-500 text-white m-1 font-semibold"
          variant="default"
          color="red"
        >
          Reset
        </Button>
        <Group className="z-20 flex flex-wrap justify-center">
          {SWATCHES.map((Color: string) => (
            <button
              key={Color}
              style={{
                backgroundColor: Color,
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                margin: "2px",
                cursor: "pointer",
                borderStyle: "none",
                position: "relative",
              }}
              onClick={() => setColor(Color)}
            />
          ))}
        </Group>
        <Button
          className="h-10 px-4 py-2 z-20 bg-gray-500 text-white m-1"
          variant="default"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-eraser"
          >
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
          </svg>
        </Button>
        <div className="flex items-center space-x-2 bg-gray-700 p-2 rounded z-20 text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-pen"
          >
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
          </svg>
          <div>
            <input className="cursor-pointer" type="range" />
          </div>
          <span>3px</span>
        </div>
        <Button
          onClick={sendData}
          className="h-10 px-4 py-2 z-20 bg-green-500 text-white m-1 font-semibold"
          variant="default"
          color="green"
        >
          Calculate
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 w-full h-full bg-black"
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
            onStop={(e, data) => {
              console.log(e);
              setLatexPosition({ x: data.x, y: data.y });
            }}
          >
            <div className="absolute p-2 text-white rounded shadow-md">
              <div className="latex-content">{latex}</div>
            </div>
          </Draggable>
        ))}
      <Link
        to="https://www.github.com/webbedpiyush/litCalc-fe/"
        target="_blank"
      >
        <Button className="absolute bottom-4 right-4 z-50 bg-blue-500 text-white font-semibold h-10 px-4 py-4">
          Github
        </Button>
      </Link>
    </>
  );
}
