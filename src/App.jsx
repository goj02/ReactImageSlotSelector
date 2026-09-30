import React, { useEffect, useMemo, useRef, useState } from "react";
import "./SlotMachine.css";

const SPIN_INTERVAL = 90;
const STOP_DELAY = 500;
const STOP_SLOWDOWN_MS = 700;

const imageModules = import.meta.glob("./images/**/*.{jpg,jpeg,JPG,JPEG}", {
  eager: true,
  import: "default",
});

function buildImagesForFolder(folderKey) {
  const prefix = `./images/${folderKey}/`;
  return Object.entries(imageModules)
    .filter(([path]) => path.startsWith(prefix))
    .map(([path, src]) => {
      const fileName = path.split("/").pop();
      return {
        src,
        name: fileName.replace(/\.[^.]+$/, ""),
      };
    });
}

function pickUniqueThree(images) {
  const pool = [...images];
  const picked = [];

  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return picked;
}

function Reel({ spinning, finalImage, label, images }) {
  const [displayIndex, setDisplayIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    clearInterval(intervalRef.current);

    if (spinning && images.length > 0 && !finalImage) {
      intervalRef.current = setInterval(() => {
        setDisplayIndex((prev) => (prev + 1) % images.length);
      }, SPIN_INTERVAL);
    }

    if (finalImage && images.length > 0) {
      const idx = images.findIndex((img) => img.src === finalImage.src);
      if (idx >= 0) setDisplayIndex(idx);
    }

    return () => clearInterval(intervalRef.current);
  }, [spinning, finalImage, images]);

  const current = images.length > 0
    ? finalImage?.src
      ? images.find((img) => img.src === finalImage.src) || images[displayIndex]
      : images[displayIndex]
    : null;

  if (!current) {
    return (
      <div className="reel-wrap">
        <div className="reel">
          <div className="no-image">No images found</div>
        </div>
        <div className="reel-label">No images found</div>
      </div>
    );
  }

  return (
    <div className="reel-wrap">
      <div className={`reel ${spinning ? "spinning" : ""}`}>
        <img
          src={current.src}
          alt={current.name}
          className="reel-image"
          width={200}
          height={200}
        />
      </div>
      <div className="reel-label">{label || current.name}</div>
    </div>
  );
}

export default function SlotMachine() {
  const IMAGE_SETS = {
    Ultra: "Ultra",
    Great: "Great",
    MegaColorCupGreatLeague: "Mega Color Cup Great League",
    // GROUPA: "GROUPA",
  };

  const [folderKey, setFolderKey] = useState("Ultra");  //was throwing no image error if set to nonexistant folder
  const [availableImages, setAvailableImages] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [results, setResults] = useState([null, null, null]);
  const [message, setMessage] = useState("Click SPIN to start.");
  const stopTimers = useRef([]);

  const folderIcons = {
    Ultra: new URL("./images/Icons/Ultra.png", import.meta.url).href,
    Great: new URL("./images/Icons/Great.png", import.meta.url).href,
    MegaColorCupGreatLeague: new URL("./images/Icons/MegaColorCupGreatLeague.png", import.meta.url).href,

  };

  const folderImages = useMemo(
    () => buildImagesForFolder(folderKey),
    [folderKey]
  );

  useEffect(() => {
    setAvailableImages(folderImages);
    setResults([null, null, null]);
    setSpinning(false);
    setStopping(false);
    setMessage(folderImages.length ? "Click SPIN to start." : "No images found in this folder.");
  }, [folderImages]);

  const clearStopTimers = () => {
    stopTimers.current.forEach(clearTimeout);
    stopTimers.current = [];
  };

  const startSpin = () => {
    if (availableImages.length < 3) {
      setMessage("Need at least 3 jpg images in the selected folder.");
      return;
    }

    clearStopTimers();
    setResults([null, null, null]);
    setSpinning(true);
    setStopping(false);
    setMessage("Selecting Pokemon...");
  };

  const stopSpin = () => {
    if (!spinning || stopping) return;
    if (availableImages.length < 3) return;

    setStopping(true);
    setMessage("Stopping left to right...");

    const picked = pickUniqueThree(availableImages);

    [0, 1, 2].forEach((reelIndex) => {
      stopTimers.current.push(
        setTimeout(() => {
          setResults((prev) => {
            const next = [...prev];
            next[reelIndex] = picked[reelIndex];
            return next;
          });

          if (reelIndex === 2) {
            setTimeout(() => {
              setSpinning(false);
              setStopping(false);
              setMessage("Here is your team!");
            }, STOP_SLOWDOWN_MS);
          }
        }, reelIndex * STOP_DELAY)
      );
    });
  };

  const handleButtonClick = () => {
    if (!spinning) startSpin();
    else stopSpin();
  };

  return (
    <div className="slot-page">
      <h1 className="title">Random Pokemon Team</h1>

      
      {/* <div style={{ marginBottom: 8 }}>
        <label htmlFor="folderSelect" style={{ marginRight: 8 }}>
          Select Battle League:
        </label>
        <select
          id="folderSelect"
          value={folderKey}
          onChange={(e) => setFolderKey(e.target.value)}
        >
          {Object.keys(IMAGE_SETS).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div> */}

      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
        <label htmlFor="folderSelect">Select Battle League:</label>

        <select
          id="folderSelect"
          value={folderKey}
          onChange={(e) => setFolderKey(e.target.value)}
        >
          {Object.keys(IMAGE_SETS).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>

        <img
          src={folderIcons[folderKey]}
          alt={folderKey}
          width={32}
          height={32}
          style={{ objectFit: "cover", borderRadius: 4 }}
        />
    </div>




      <div className="reels">
        <Reel spinning={spinning && !results[0]} finalImage={results[0]} label={results[0]?.name} images={availableImages} />
        <Reel spinning={spinning && !results[1]} finalImage={results[1]} label={results[1]?.name} images={availableImages} />
        <Reel spinning={spinning && !results[2]} finalImage={results[2]} label={results[2]?.name} images={availableImages} />
      </div>

      <button className="spin-btn" onClick={handleButtonClick}>
        {spinning ? "STOP" : "SPIN"}
      </button>

      <p className="message">{message}</p>
    </div>
  );
}
