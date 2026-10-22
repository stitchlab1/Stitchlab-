import React, { useState, useEffect, useRef } from "react";
import { Timer, ChevronRight, Pause, Play, Hand } from "lucide-react";

interface LearningTimerProps {
  isLoggedIn: boolean;
  uid?: string;
}

export default function LearningTimer({ isLoggedIn, uid }: LearningTimerProps) {
  // Always starts counting from 0 upon student entry / opening the page
  const [seconds, setSeconds] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isPageVisible, setIsPageVisible] = useState<boolean>(!document.hidden);
  // Starts active immediately upon entry ("يبدا يعد فور دخول الطالب")
  const [isTouchActive, setIsTouchActive] = useState<boolean>(true);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Requirement: "يبدا يعد فور دخول الطالب ولو خرج اقفل الصفحة ودخل مرة اخرى يبدا العد من صفر"
  // Whenever the student enters, reset and start from 0
  useEffect(() => {
    if (isLoggedIn) {
      setSeconds(0);
      setIsTouchActive(true);
    } else {
      setSeconds(0);
      setIsTouchActive(false);
    }
  }, [isLoggedIn, uid]);

  // Requirement: "ولو توقف اللمس يتوقف العد"
  // Detect touch / interaction. If touch stops for 4 seconds, the count pauses.
  useEffect(() => {
    if (!isLoggedIn) return;

    // Reset inactivity timer and keep counting active while touched
    const resetTouchActivity = () => {
      setIsTouchActive(true);

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // If no touch occurs for 4 seconds, pause the timer ("توقف اللمس يتوقف العد")
      inactivityTimerRef.current = setTimeout(() => {
        setIsTouchActive(false);
      }, 4000);
    };

    // Initial activity upon entry ("يبدا يعد فور دخول الطالب")
    resetTouchActivity();

    // Event listeners covering all touch and pointer interactions
    const touchEvents = [
      "touchstart",
      "touchmove",
      "touchend",
      "pointerdown",
      "pointermove",
      "pointerup",
      "mousedown",
      "mousemove",
      "click",
      "scroll",
      "keydown"
    ];

    const handleInteraction = () => {
      resetTouchActivity();
    };

    touchEvents.forEach((evt) => {
      window.addEventListener(evt, handleInteraction, { passive: true });
    });

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      touchEvents.forEach((evt) => {
        window.removeEventListener(evt, handleInteraction);
      });
    };
  }, [isLoggedIn]);

  // Handle visibility changes to stop timer when minimized/hidden/tab switched
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
      if (document.hidden) {
        setIsTouchActive(false);
      }
    };

    const handleWindowFocus = () => {
      setIsPageVisible(true);
      setIsTouchActive(true);
    };
    const handleWindowBlur = () => {
      setIsPageVisible(false);
      setIsTouchActive(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  // Update timer every second ONLY when student is logged in, page is visible, AND touch/interaction is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const isCounting = isLoggedIn && isPageVisible && isTouchActive;

    if (isCounting) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoggedIn, isPageVisible, isTouchActive]);

  // Format time as HH:MM:SS
  const formatTime = (totalSecs: number): string => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  if (!isLoggedIn) return null;

  return (
    <div 
      id="learning-timer-widget"
      className="fixed bottom-24 right-4 z-40 sm:bottom-6 sm:right-6 transition-all duration-300 ease-in-out"
      dir="rtl"
    >
      {isCollapsed ? (
        // Collapsed State: Sleek interactive circle button with status glow
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className={`flex items-center justify-center p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/20 ${
            isTouchActive && isPageVisible
              ? "bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-pink-500/20"
              : "bg-slate-700 text-amber-300 border-amber-400/40"
          }`}
          title={isTouchActive ? "مؤقت التعلم (نشط ويعد الآن)" : "مؤقت التعلم (متوقف - المس الشاشة للمتابعة)"}
        >
          <Timer className={`w-5 h-5 ${isTouchActive && isPageVisible ? "animate-pulse" : "opacity-80"}`} />
        </button>
      ) : (
        // Expanded State: Glassmorphism control card with live status indicator
        <div className={`backdrop-blur-md rounded-2xl p-3 shadow-xl border transition-all duration-200 flex items-center gap-3 animate-fadeIn max-w-[300px] ${
          isTouchActive && isPageVisible
            ? "bg-white/95 border-pink-100 shadow-pink-500/10"
            : "bg-amber-50/95 border-amber-200 shadow-amber-500/10"
        }`}>
          {/* Collapse toggle button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-pink-50 rounded-lg text-slate-400 hover:text-pink-600 transition-colors cursor-pointer"
            title="تصغير المؤقت"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Time & Title Info */}
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-pink-600 flex items-center gap-1">
                {isTouchActive && isPageVisible ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>مؤقت التعلم (يعد الآن)</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-amber-800 font-bold">متوقف (توقف اللمس)</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-base font-extrabold font-mono tracking-wider select-all ${
                isTouchActive && isPageVisible ? "text-slate-800" : "text-amber-900/80"
              }`}>
                {formatTime(seconds)}
              </span>
              
              {!isTouchActive && (
                <span className="text-[9px] font-bold text-amber-700 animate-pulse flex items-center gap-0.5">
                  <Hand className="w-2.5 h-2.5" />
                  <span>المس الشاشة للاستئناف</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
