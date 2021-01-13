import Head from 'next/head';
import {useEffect, useState, useRef} from 'react';
import {
  Grid,
  Button,
  Select,
  InputLabel,
  FormControl,
  MenuItem
} from '@material-ui/core';
import styles from '../styles/Home.module.sass';

export default function Home() {
  let fieldingPositions = {
    "Default": {
      "0": { x: 535, y: 390 }, // Wicketkeeper
      "1": { x: 510, y: 380 }, // Slip
      "2": { x: 520, y: 760 }, // Bowler
      "3": { x: 420, y: 760 }, // Mid-off
      "4": { x: 660, y: 760 }, // Mid-on
      "5": { x: 320, y: 600 }, // Cover
      "6": { x: 760, y: 600 }, // Mid-wicket
      "7": { x: 320, y: 440 }, // Point
      "8": { x: 760, y: 440 }, // Square leg
      "9": { x: 310, y: 100 }, // 3rd man
      "10": { x: 770, y: 100 }, // Fine leg
    },
    "Leg Spinner": {
      "0": { x: 535, y: 450 }, // Wicketkeeper
      "1": { x: 515, y: 440 }, // Slip
      "2": { x: 520, y: 630 }, // Bowler
      "3": { x: 330, y: 980 }, // Long-off
      "4": { x: 700, y: 980 }, // Long-on
      "5": { x: 350, y: 640 }, // Extra cover
      "6": { x: 760, y: 600 }, // Mid-wicket
      "7": { x: 340, y: 420 }, // Point
      "8": { x: 1000, y: 440 }, // Deep square
      "9": { x: 70, y: 540 }, // Deep cover
      "10": { x: 670, y: 340 }, // Short fine
    },
    "Off Spinner": {
      "0": { x: 520, y: 630 }, // Bowler
      "1": { x: 535, y: 450 }, // Wicketkeeper
      "2": { x: 980, y: 770 }, // Cow corner
      "3": { x: 330, y: 980 }, // Long-off
      "4": { x: 700, y: 980 }, // Long-on
      "5": { x: 330, y: 520 }, // Cover
      "6": { x: 350, y: 640 }, // Extra cover
      "7": { x: 760, y: 600 }, // Mid-wicket
      "8": { x: 360, y: 400 }, // Backward point
      "9": { x: 1000, y: 440 }, // Deep square
      "10": { x: 670, y: 340 }, // Short fine
    }
  };

  let battingPositions = {
    "0": { x: 540, y: 470 },
    "1": { x: 555, y: 610 }
  };

  let canvas = useRef();
  let container = useRef();
  let ctx = useRef();
  let scale = useRef(1.0);
  let clicked = useRef(false);
  let fielder = useRef(-1);

  let [preset, setPreset] = useState(Object.keys(fieldingPositions)[0]);

  let pitchImg = useRef();
  let fielderImg = useRef();
  let batterImg = useRef();

  const drawPitch = () => {
    ctx.current.drawImage(pitchImg.current, 0, 0, 1080, 1080);
  };

  const drawFielders = () => {
    let size;
    if (container.current.offsetWidth > 700) {
      size = Math.max(scale.current * 30.0, 30);
    } else {
      size = Math.max(scale.current * 40.0, 30);
    }

    Object.values(fieldingPositions[preset]).forEach((f, i) => {
      ctx.current.drawImage(fielderImg.current, 0, 0, 40, 40, f.x - size/2, f.y - size/2, size, size);
    });
  };

  const drawBatters = () => {
    let size;
    if (container.current.offsetWidth > 700) {
      size = Math.max(scale.current * 30.0, 30);
    } else {
      size = Math.max(scale.current * 40.0, 30);
    }

    Object.values(battingPositions).forEach((f, i) => {
      ctx.current.drawImage(batterImg.current, 0, 0, 40, 40, f.x - size/2, f.y - size/2, size, size);
    });
  }

  const redraw = () => {
    (() => {
      return new Promise((res, rej) => {
        drawPitch();
        res();
      })
    })().then(() => {
      drawFielders();
      drawBatters();
    });
  }

  useEffect(() => {
    let c = canvas.current;
    ctx.current = c.getContext('2d');

    scale.current = container.current.offsetHeight / 1080.0;

    let promises = [];
    promises.push(loadImage('./images/FieldingCircle.png'));
    promises.push(loadImage('./images/Fielder.png'));
    promises.push(loadImage('./images/Batter.png'));

    Promise.all(promises).then((values) => {
      pitchImg.current = values[0];
      fielderImg.current = values[1];
      batterImg.current = values[2];

      window.requestAnimationFrame(redraw);
      window.setTimeout(() => {
        window.requestAnimationFrame(redraw);
      }, 500);
    }).catch((err) => console.error(err));

    canvas.current.addEventListener('mousedown', (e) => {
      clicked.current = true;
      let x = e.layerX / scale.current;
      let y = e.layerY / scale.current;
      fielder.current = findFielder(x, y);
    });
    canvas.current.addEventListener('touchstart', (e) => {
      e.preventDefault();
      clicked.current = true;
      let x = (e.targetTouches[0].pageX - canvas.current.offsetLeft) / scale.current;
      let y = (e.targetTouches[0].pageY - canvas.current.offsetTop) / scale.current;
      fielder.current = findFielder(x, y);
    });

    canvas.current.addEventListener('mouseup', (e) => {
      clicked.current = false;
    });
    canvas.current.addEventListener('touchend', (e) => {
      clicked.current = false;
    });

    canvas.current.addEventListener('mousemove', (e) => {
      let x = e.layerX / scale.current;
      let y = e.layerY / scale.current;

      if (clicked.current && fielder.current != undefined && fielder.current !== -1) {
        fieldingPositions[preset][fielder.current] = {x: x, y: y};

        window.requestAnimationFrame(redraw);
      } else {
        if (findFielder(x, y) >= 0) {
          canvas.current.style.cursor = "pointer";
        } else {
          canvas.current.style.cursor = "default";
        }
      }
    });
    canvas.current.addEventListener('touchmove', (e) => {
      e.preventDefault();
      let x = (e.targetTouches[0].pageX - canvas.current.offsetLeft) / scale.current;
      let y = (e.targetTouches[0].pageY - canvas.current.offsetTop) / scale.current;

      if (clicked.current && fielder.current != undefined && fielder.current !== -1) {
        fieldingPositions[preset][fielder.current] = {x: x, y: y};

        window.requestAnimationFrame(redraw);
      } else {
        if (findFielder(x, y) >= 0) {
          canvas.current.style.cursor = "pointer";
        } else {
          canvas.current.style.cursor = "default";
        }
      }
    });
  }, [preset]);

  const loadImage = (url) => {
    return new Promise((res, rej) => {
        let img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = res(img);
    });
  }

  const findFielder = (x, y) => {
    let offset = 25;
    if (scale.current < 0.7) offset = 50;
    let chosen = -1;

    Object.values(fieldingPositions[preset]).some((f, i) => {
      if (Math.sqrt(Math.pow(f.x - x, 2) + Math.pow(f.y - y, 2)) <= offset) {
        chosen = i;
        return true;
      }
    });
    return chosen;
  }

  const loadPreset = (e) => {
    setPreset(e.target.value);
  };

  // <Button>Save</Button>
  // <Button>Load</Button>

  let options = Object.keys(fieldingPositions).map((o, i) => {
    return <MenuItem key={i} value={o}>{o}</MenuItem>;
  });


  return (
    <>
      <Head>
        <title>Fielding Positions</title>
      </Head>

      <Grid container>
        <Grid item xs={12}>
          <FormControl className={styles.formControl}>
            <InputLabel>Presets</InputLabel>
            <Select value={preset} onChange={loadPreset}>
              {options}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <div className={styles.canvasContainer} ref={container}>
            <canvas id="canvas" ref={canvas} className={styles.canvas} height={1080} width={1080}></canvas>
          </div>
        </Grid>
      </Grid>
    </>
  );
}
