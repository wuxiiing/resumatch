"use client";

import { type ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import styles from "./OpeningAnimation.module.css";

const ANIMATION_DURATION = 3600;
const OPENING_ANIMATION_PLAYED_KEY = "resumatch:opening-animation-played";

type OpeningAnimationProps = {
  children: ReactNode;
};

export function OpeningAnimation({ children }: OpeningAnimationProps) {
  const [playId, setPlayId] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() => shouldPlayOpeningAnimation());
  const [contentVisible, setContentVisible] = useState(
    () => !shouldPlayOpeningAnimation()
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    function measureLogo() {
      const logoAnchor = document.querySelector<HTMLElement>(
        "[data-opening-logo-anchor]"
      );

      if (!logoAnchor) {
        return;
      }

      const rect = logoAnchor.getBoundingClientRect();
      setLogoPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }

    measureLogo();
    window.addEventListener("resize", measureLogo);

    return () => {
      window.removeEventListener("resize", measureLogo);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function syncMotionPreference() {
      const shouldReduce = mediaQuery.matches;
      setReducedMotion(shouldReduce);

      if (shouldReduce) {
        markOpeningAnimationPlayed();
        setIsPlaying(false);
        setContentVisible(true);
      }
    }

    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const shouldPlay = playId > 0 || shouldPlayOpeningAnimation();

    if (!shouldPlay) {
      setIsPlaying(false);
      setContentVisible(true);
      return;
    }

    setIsPlaying(true);
    setContentVisible(false);

    const contentTimer = window.setTimeout(() => {
      setContentVisible(true);
    }, 3060);
    const doneTimer = window.setTimeout(() => {
      markOpeningAnimationPlayed();
      setIsPlaying(false);
    }, ANIMATION_DURATION);

    return () => {
      window.clearTimeout(contentTimer);
      window.clearTimeout(doneTimer);
    };
  }, [playId, reducedMotion]);

  function replay() {
    if (reducedMotion) {
      return;
    }

    setPlayId((current) => current + 1);
  }

  return (
    <div
      className={styles.shell}
      style={
        {
          "--opening-logo-x": `${logoPosition.x}px`,
          "--opening-logo-y": `${logoPosition.y}px`
        } as React.CSSProperties
      }
    >
      {isPlaying && !reducedMotion ? (
        <div className={styles.intro} key={playId} aria-hidden="true">
          <span className={`${styles.line} ${styles.lineBlue}`} />
          <span className={`${styles.line} ${styles.lineDark}`} />

          <div className={styles.rmWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.rmLogo} src="/rm-logo.png" alt="" />
          </div>

          <div className={styles.finalLogo}>
            <Logo size="large" />
          </div>
        </div>
      ) : null}

      <div
        className={`${styles.content} ${
          contentVisible ? styles.contentVisible : ""
        }`}
      >
        {children}
      </div>

      <button
        className={styles.replayButton}
        onClick={replay}
        type="button"
      >
        ↺ 重播
      </button>
    </div>
  );
}

function shouldPlayOpeningAnimation(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(OPENING_ANIMATION_PLAYED_KEY) !== "true";
}

function markOpeningAnimationPlayed() {
  sessionStorage.setItem(OPENING_ANIMATION_PLAYED_KEY, "true");
}
