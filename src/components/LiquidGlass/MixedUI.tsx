import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import type {UnknownRecord} from "type-fest";
import React, {
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  IoEllipsisHorizontal,
  IoListOutline,
  IoPause,
  IoPlay,
  IoPlayBack,
  IoPlayForward,
  IoRadioOutline,
  IoRepeatOutline,
  IoSearch,
  IoShuffleOutline,
  IoVolumeHighOutline,
} from "react-icons/io5";
import { Filter as SearchboxFilter } from "./Filter";
import { Filter as PlayerFilterMobile } from "./Filter";
import { Filter as PlayerFilter } from "./Filter";

type Album = {
  collectionId: number;
  collectionName: string;
  artworkUrl100: string;
  artistName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

function upscaleArtwork(url: string, size = 600) {
  // iTunes artwork URLs include the size; replace to request a larger image
  return url.replace(/\/[0-9]+x[0-9]+bb\.(jpg|png)$/i, `/${size}x${size}bb.$1`);
}

function useIsMobileView() {
  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export const MixedUI: React.FC = ({}) => {
  const [query, setQuery] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const isMobile = useIsMobileView();

  // Interactive controls (MotionValues only)
  const specularSaturation = useMotionValue(6); // 0..50
  const specularOpacity = useMotionValue(0.4); // 0..1
  const refractionLevel = useMotionValue(1); // 0..1
  const blur = useMotionValue(1); // 0..40
  const progressiveBlurStrength = useMotionValue(1); // how much to ease the blur in the top overlay
  const glassBackgroundOpacity = useMotionValue(0.6); // 0..1
  // Tracks preferred color scheme as a MotionValue: 'light' | 'dark'
  const colorScheme = useMotionValue<"light" | "dark">("light");
  // Track scroll position for bottom gradient fade
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scrollY, scrollYProgress } = useScroll({
    container: scrollContainerRef,
  });

  const scrollDistanceToBottom = useTransform(() => {
    const y = scrollY.get();
    const progress = scrollYProgress.get();
    return (1 - progress) * (y / progress);
  });

  // Transform scroll position to bottom fade (fade out when within 200px of bottom)
  const bottomGradientOpacity = useTransform(() => {
    const distanceToBottom = scrollDistanceToBottom.get();
    if (distanceToBottom < 200) {
      return distanceToBottom / 200;
    }
    return 1;
  });

  // Transform scroll position to top fade (fade in when scrolled past 200px)
  const topGradientOpacity = useTransform(() => {
    // Fade in from 0 to 1 over first 200px of scroll
    return Math.min(1, scrollY.get() / 100);
  });

  // Transform scroll position for searchbox opacity (fade out as user scrolls)
  const searchboxShadowOpacity = useTransform(
    scrollY,
    (scrollYValue: number) => {
      // Start at full opacity, fade out over first 100px of scroll
      return Math.min(1, 0.2 + (scrollYValue / 200) * 0.8);
    }
  );

  // Transform scroll distance to bottom for player shadow opacity (fade in when close to bottom)
  const playerShadowOpacity = useTransform(
    scrollDistanceToBottom,
    (distanceToBottom) => {
      // Start at reduced opacity, fade in as user gets closer to bottom
      return Math.min(1, 0.2 + (distanceToBottom / 300) * 0.8);
    }
  );

  // Sync colorScheme with prefers-color-scheme
  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => colorScheme.set(mq.matches ? "dark" : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [colorScheme]);

  // Hold last loaded albums so bottom player can render outside Suspense
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [albums, setAlbums] = useState<Album[] | null>(null);

  // Searchbox glass params
  const sbHeight = 42;
  const sbWidth = 320;
  const sbRadius = sbHeight / 2;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const pointerDown = useMotionValue(0);
  const focused = useMotionValue(0);

  // Sync colorScheme with prefers-color-scheme
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => colorScheme.set(mq.matches ? "dark" : "light");
    apply();
    // Support older Safari by falling back to addListener/removeListener
    const listener = () => apply();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(listener);
      return () => mq.removeListener(listener);
    }
  }, [colorScheme]);

  // Floating player dimensions (used to pad the scroll area bottom)
  const playerWidthDesktop = 640;
  const playerHeightDesktop = 63;
  const playerWidthMobile = 320;
  const playerHeightMobile = 54;
  const playerWidth = isMobile ? playerWidthMobile : playerWidthDesktop;
  const playerHeight = isMobile ? playerHeightMobile : playerHeightDesktop;
  const playerBottomOffset = 24; // Tailwind bottom-6 = 1.5rem = 24px
  const playerExtraBreathingRoom = 24; // small gap so the last row isn't glued to the player

  const listBottomPadding =
    playerHeightDesktop + playerBottomOffset + playerExtraBreathingRoom; // 68 + 24 + 24 = 116

  // UI scale: 0.9 idle → 1 when focused
  const uiScale = useSpring(useTransform(focused, [0, 1], [0.9, 1]), {
    damping: 34,
    stiffness: 800,
  });

  return (
    <div>
      <motion.div
        className="relative h-[640px] max-h-[70vh] rounded-xl -ml-[19px] w-[calc(100%+38px)] border border-black/15 dark:border-white/15 overflow-hidden text-black/5 dark:text-white/5 bg-white dark:bg-black select-none [--glass-rgb:#FFFFFF] dark:[--glass-rgb:#222222] contain-layout contain-style contain-paint [content-visibility:auto] [contain-intrinsic-size:640px]"
        style={
          {
            "--glass-bg-alpha": useTransform(
              glassBackgroundOpacity,
              (x) => `${Math.round(x * 100)}%`
            ),
          } as React.CSSProperties
        }
      >
        {/* Albums grid layer (behind) */}
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-y-auto px-6 z-0"
          style={{
            paddingTop: sbHeight + 42,
            paddingBottom: listBottomPadding,
          }}
        >
          {albums?.length ? (
            <h3 className="text-xl text-black dark:text-white mb-5 select-none">
              Top Results
            </h3>
          ) : (
            <div className="h-[90%] mb-5 flex justify-center items-center text-black/40 dark:text-white/40">
              No results
            </div>
          )}
          <ErrorBoundary>
            <React.Suspense fallback={<AlbumGridSkeleton />}>
              <AlbumGrid
                query={query}
                onLoaded={setAlbums}
                onSelect={setCurrentAlbum}
              />
            </React.Suspense>
          </ErrorBoundary>
        </div>

        {/* Top searchbox overlay */}
        <motion.div
          className="absolute left-1/2 top-6 -translate-x-1/2 z-10"
          style={{
            width: sbWidth,
            height: sbHeight,
            scale: uiScale,
          }}
          onMouseDown={() => {
            pointerDown.set(1);
            inputRef.current?.focus();
          }}
          onMouseUp={() => pointerDown.set(0)}
        >
          <SearchboxFilter
            id="mixed-ui-search-filter"
            blur={blur}
            scaleRatio={refractionLevel}
            specularOpacity={specularOpacity}
            specularSaturation={specularSaturation}
            width={320}
            height={42}
            radius={21}
            bezelWidth={18}
            glassThickness={100}
            refractiveIndex={1.3}
            bezelType="convex_squircle"
          />

          <motion.div
            className="absolute inset-0 bg-[var(--glass-rgb)]/[var(--glass-bg-alpha)]"
            style={{
              borderRadius: sbRadius,
              backdropFilter: `url(#mixed-ui-search-filter)`,
              boxShadow: useTransform(
                () =>
                  `0 4px 20px rgba(0, 0, 0, ${
                    0.4 * searchboxShadowOpacity.get()
                  })`
              ),
            }}
          />

          <div
            className="absolute inset-0 flex items-center gap-3 px-3.5"
            style={{ borderRadius: sbRadius, zIndex: 1 }}
          >
            <IoSearch
              className="text-black/60 dark:text-white/50 shrink-0"
              size={22}
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              placeholder="搜索"
              aria-label="搜索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => focused.set(1)}
              onBlur={() => focused.set(0)}
              className="flex-1 min-w-0 bg-transparent outline-none border-0 text-[16px] leading-none text-black/80 dark:text-white/80 placeholder-black/40 dark:placeholder-white/40 selection:bg-blue-500/30 selection:text-inherit select-text text-shadow-xs text-shadow-white/30 dark:text-shadow-black/60"
              style={{ padding: 0 }}
            />
          </div>
        </motion.div>

        <motion.div className="absolute top-0 left-0 w-full h-[130px] pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full h-full backdrop-blur-[0.8px] mask-b-from-70% mask-b-to-100%"
            style={{
              backdropFilter: useTransform(
                () =>
                  `blur(${
                    Math.sqrt(
                      Math.sqrt(
                        progressiveBlurStrength.get() * topGradientOpacity.get()
                      )
                    ) / 2
                  }px)`
              ),
            }}
          />
          <motion.div
            className="absolute top-0 left-0 w-full h-full backdrop-blur-[2px] mask-b-from-50% mask-b-to-75%"
            style={{
              backdropFilter: useTransform(
                () =>
                  `blur(${Math.sqrt(
                    progressiveBlurStrength.get() * topGradientOpacity.get()
                  )}px)`
              ),
            }}
          />
          <motion.div
            className="absolute top-0 left-0 w-full h-full backdrop-blur-[4px] mask-b-from-20% mask-b-to-55%"
            style={{
              backdropFilter: useTransform(
                () =>
                  `blur(${
                    progressiveBlurStrength.get() * topGradientOpacity.get()
                  }px)`
              ),
            }}
          />
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-[var(--glass-rgb)]/40 dark:from-[var(--glass-rgb)]/60 to-transparent"
            style={{
              opacity: topGradientOpacity,
            }}
          />
        </motion.div>

        {/* Bottom player overlay (Apple Music–like) */}
        <div
          className="pointer-events-none absolute left-1/2 bottom-6 -translate-x-1/2 z-10"
          style={{ width: playerWidth, height: playerHeight }}
        >
          {/* Glass backdrop */}
          <PlayerFilter
            id="mixed-ui-player-filter"
            blur={blur}
            scaleRatio={refractionLevel}
            specularOpacity={specularOpacity}
            specularSaturation={specularSaturation}
            width={640}
            height={63}
            radius={31}
            bezelWidth={29}
            glassThickness={90}
            refractiveIndex={1.3}
            bezelType="convex_squircle"
          />
          <PlayerFilterMobile
            id="mixed-ui-player-filter-mobile"
            blur={blur}
            scaleRatio={refractionLevel}
            specularOpacity={specularOpacity}
            specularSaturation={specularSaturation}
            width={320}
            height={54}
            radius={27}
            bezelWidth={29}
            glassThickness={90}
            refractiveIndex={1.3}
            bezelType="convex_squircle"
          />
          <motion.div
            className="absolute inset-0 bg-[var(--glass-rgb)]/[var(--glass-bg-alpha)]"
            style={{
              borderRadius: 34,
              backdropFilter: isMobile
                ? `url(#mixed-ui-player-filter-mobile)`
                : `url(#mixed-ui-player-filter)`,
              boxShadow: useTransform(
                () =>
                  `0 4px 19px rgba(0, 0, 0, ${0.4 * playerShadowOpacity.get()})`
              ),
            }}
          />

          {/* Content */}
          <div
            className="pointer-events-auto absolute inset-0 flex items-center gap-4 px-6"
            style={{ borderRadius: 34 }}
          >
            {/* Left controls */}
            <div className="flex items-center gap-3 text-black/80 dark:text-white/80">
              {!isMobile && (
                <>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-1 transition-transform duration-150 ease-out hover:scale-110 active:scale-90 focus:outline-none cursor-pointer"
                    aria-label="Shuffle"
                  >
                    <IoShuffleOutline size={18} className="opacity-70" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-1 transition-transform duration-150 ease-out hover:scale-110 active:scale-90 focus:outline-none cursor-pointer"
                    aria-label="Previous"
                  >
                    <IoPlayBack size={20} />
                  </button>
                </>
              )}
              {(!!currentAlbum || !isMobile) && (
                <>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-2 transition-transform duration-150 ease-out hover:scale-110 active:scale-90 focus:outline-none cursor-pointer"
                    onClick={() => setIsPlaying((v) => !v)}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <IoPause size={29} /> : <IoPlay size={29} />}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-1 transition-transform duration-150 ease-out hover:scale-110 active:scale-90 focus:outline-none cursor-pointer"
                    aria-label="Next"
                  >
                    <IoPlayForward size={20} />
                  </button>
                </>
              )}

              {!isMobile && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-1 transition-transform duration-150 ease-out hover:scale-110 active:scale-90 focus:outline-none cursor-pointer"
                  aria-label="Repeat"
                >
                  <IoRepeatOutline size={18} className="opacity-70" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-14 w-14 rounded overflow-hidden bg-black/10 dark:bg-white/10 shrink-0">
                {currentAlbum?.artworkUrl100 && (
                  <img
                    src={upscaleArtwork(currentAlbum?.artworkUrl100, 200)}
                    alt={currentAlbum?.collectionName}
                    className="w-full h-full object-cover m-0"
                    draggable={false}
                    loading="lazy"
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[14px] text-black/90 dark:text-white/90 truncate [line-height:1.3] text-shadow-xs text-shadow-white/30 dark:text-shadow-black/60">
                  {currentAlbum?.collectionName ?? "\u00A0"}
                </div>
                <div className="text-[11px] text-black/60 dark:text-white/60 truncate text-shadow-xs [line-height:1.3] text-shadow-white/30 dark:text-shadow-black/60">
                  {currentAlbum?.artistName
                    ? `${currentAlbum?.artistName} — ${currentAlbum?.collectionName}`
                    : "\u00A0"}
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-[3px] w-[460px] max-w-full bg-black/10 dark:bg-white/10 rounded">
                  <div className="h-full w-1/3 bg-black/40 dark:bg-white/40 rounded" />
                </div>
              </div>
            </div>

            {/* Right actions */}
            {!isMobile && (
              <div className="flex items-center gap-4 text-black/80 dark:text-white/80">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-1 transition-transform duration-150 ease-out hover:scale-110 active:scale-90 focus:outline-none cursor-pointer"
                  aria-label="More Options"
                >
                  <IoEllipsisHorizontal size={20} className="opacity-80" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-1 transition-transform duration-150 ease-out hover:scale-110 active:scale-90 focus:outline-none cursor-pointer"
                  aria-label="List"
                >
                  <IoListOutline size={18} className="opacity-70" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-1 transition-transform duration-150 ease-out hover:scale-110 active:scale-90 focus:outline-none cursor-pointer"
                  aria-label="Radio"
                >
                  <IoRadioOutline size={18} />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-1 transition-transform duration-150 ease-out hover:scale-110 active:scale-90 focus:outline-none cursor-pointer"
                  aria-label="Volume"
                >
                  <IoVolumeHighOutline size={22} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom black gradient overlay with blur layers */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-[130px] pointer-events-none overflow-hidden"
          style={{
            opacity: bottomGradientOpacity,
          }}
        >
          <motion.div className="absolute bottom-0 left-0 w-full h-full backdrop-blur-[0.4px] mask-t-from-0% mask-t-to-100%" />
          <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/10 dark:from-black/60 to-transparent" />
        </motion.div>
      </motion.div>

      {/* Controls (MotionValue-driven; Swiss Design style; no React state) */}
      <div className="mt-8 space-y-3 text-black/80 dark:text-white/80">
        <div className="flex items-center gap-4">
          <div className="uppercase tracking-[0.14em] text-[10px] opacity-70 select-none">
            参数
          </div>
          <div className="h-[1px] flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        {/* 镜面反射透明度 */}
        <div className="flex items-center gap-4">
          <label className="w-56 uppercase tracking-[0.08em] text-[11px] opacity-80 select-none [line-height:1.2]">
            镜面反射透明度
          </label>
          <motion.span className="w-14 text-right font-mono tabular-nums text-[11px] text-black/60 dark:text-white/60">
            {useTransform(specularOpacity, (v) => v.toFixed(2))}
          </motion.span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            defaultValue={specularOpacity.get()}
            onInput={(e) =>
              specularOpacity.set(parseFloat(e.currentTarget.value))
            }
            className="flex-1 appearance-none h-[2px] bg-black/20 dark:bg-white/20 rounded outline-none"
            aria-label="镜面反射透明度"
          />
        </div>

        {/* 镜面饱和度 */}
        <div className="flex items-center gap-4">
          <label className="w-56 uppercase tracking-[0.08em] text-[11px] opacity-80 select-none [line-height:1.2]">
            镜面饱和度
          </label>

          <motion.span className="w-14 text-right font-mono tabular-nums text-[11px] text-black/60 dark:text-white/60">
            {useTransform(specularSaturation, (v) => Math.round(v).toString())}
          </motion.span>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            defaultValue={specularSaturation.get()}
            onInput={(e) =>
              specularSaturation.set(parseFloat(e.currentTarget.value))
            }
            className="flex-1 appearance-none h-[2px] bg-black/20 dark:bg-white/20 rounded outline-none"
            aria-label="镜面饱和度"
          />
        </div>

        {/* 折射等级 */}
        <div className="flex items-center gap-4">
          <label className="w-56 uppercase tracking-[0.08em] text-[11px] opacity-80 select-none [line-height:1.2]">
            折射等级
          </label>
          <motion.span className="w-14 text-right font-mono tabular-nums text-[11px] text-black/60 dark:text-white/60">
            {useTransform(refractionLevel, (v) => v.toFixed(2))}
          </motion.span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            defaultValue={refractionLevel.get()}
            onInput={(e) =>
              refractionLevel.set(parseFloat(e.currentTarget.value))
            }
            className="flex-1 appearance-none h-[2px] bg-black/20 dark:bg-white/20 rounded outline-none"
            aria-label="折射等级"
          />
        </div>

        {/* 模糊等级 */}
        <div className="flex items-center gap-4">
          <label className="w-56 uppercase tracking-[0.08em] text-[11px] opacity-80 select-none [line-height:1.2]">
            模糊等级
          </label>
          <motion.span className="w-14 text-right font-mono tabular-nums text-[11px] text-black/60 dark:text-white/60">
            {useTransform(blur, (v) => v.toFixed(1))}
          </motion.span>
          <input
            type="range"
            min={0}
            max={40}
            step={0.1}
            defaultValue={blur.get()}
            onInput={(e) => blur.set(parseFloat(e.currentTarget.value))}
            className="flex-1 appearance-none h-[2px] bg-black/20 dark:bg-white/20 rounded outline-none"
            aria-label="模糊等级"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="w-56 uppercase tracking-[0.08em] text-[11px] opacity-80 select-none [line-height:1.2]">
            渐进模糊强度
          </label>
          <motion.span className="w-14 text-right font-mono tabular-nums text-[11px] text-black/60 dark:text-white/60">
            {useTransform(progressiveBlurStrength, (v) => v.toFixed(2))}
          </motion.span>
          <input
            type="range"
            min={0}
            max={10}
            step={0.01}
            defaultValue={progressiveBlurStrength.get()}
            onInput={(e) =>
              progressiveBlurStrength.set(parseFloat(e.currentTarget.value))
            }
            className="flex-1 appearance-none h-[2px] bg-black/20 dark:bg-white/20 rounded outline-none"
            aria-label="渐进模糊强度"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="w-56 uppercase tracking-[0.08em] text-[11px] opacity-80 select-none [line-height:1.2]">
            玻璃背景透明度
          </label>
          <motion.span className="w-14 text-right font-mono tabular-nums text-[11px] text-black/60 dark:text-white/60">
            {useTransform(glassBackgroundOpacity, (v) => v.toFixed(2))}
          </motion.span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            defaultValue={glassBackgroundOpacity.get()}
            onInput={(e) =>
              glassBackgroundOpacity.set(parseFloat(e.currentTarget.value))
            }
            className="flex-1 appearance-none h-[2px] bg-black/20 dark:bg-white/20 rounded outline-none"
            aria-label="玻璃背景透明度"
          />
        </div>
      </div>
    </div>
  );
};

// Suspense helpers ---------------------------------------------------------
const albumPromiseCache = new Map<string, Promise<Album[]>>();

function fetchAlbums(term: string): Promise<Album[]> {
  const results: Album[] = [
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 344799413,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "Experience Hendrix: The Best of Jimi Hendrix",
      collectionCensoredName: "Experience Hendrix: The Best of Jimi Hendrix",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/experience-hendrix-the-best-of-jimi-hendrix/344799413?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/53/e9/b9/53e9b9f0-97f4-aac7-ee5b-12c2f2007ad3/884977413878.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/53/e9/b9/53e9b9f0-97f4-aac7-ee5b-12c2f2007ad3/884977413878.jpg/100x100bb.jpg",
      collectionPrice: 11.99,
      collectionExplicitness: "notExplicit",
      trackCount: 20,
      copyright: "℗ This compilation (P) 1997 Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1997-09-16T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 344803075,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "Voodoo Child: The Jimi Hendrix Collection",
      collectionCensoredName: "Voodoo Child: The Jimi Hendrix Collection",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/voodoo-child-the-jimi-hendrix-collection/344803075?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/04/85/97/0485973d-6920-b651-f20d-5393755a6665/mzi.uexbwasy.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/04/85/97/0485973d-6920-b651-f20d-5393755a6665/mzi.uexbwasy.jpg/100x100bb.jpg",
      collectionPrice: 19.99,
      collectionExplicitness: "notExplicit",
      trackCount: 30,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2001-05-08T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 680248050,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "The Jimi Hendrix Experience (Deluxe Reissue)",
      collectionCensoredName: "The Jimi Hendrix Experience (Deluxe Reissue)",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/the-jimi-hendrix-experience-deluxe-reissue/680248050?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/97/88/1b/97881bb9-40d4-22e8-0a8b-b611a70eb501/dj.kcvgmwmy.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/97/88/1b/97881bb9-40d4-22e8-0a8b-b611a70eb501/dj.kcvgmwmy.jpg/100x100bb.jpg",
      collectionPrice: 29.99,
      collectionExplicitness: "notExplicit",
      trackCount: 60,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2000-09-12T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 4035426,
      collectionId: 476646847,
      artistName: "Various Artists",
      collectionName: "Power of Soul: A Tribute to Jimi Hendrix",
      collectionCensoredName: "Power of Soul: A Tribute to Jimi Hendrix",
      collectionViewUrl:
        "https://music.apple.com/us/album/power-of-soul-a-tribute-to-jimi-hendrix/476646847?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/0e/7d/82/mzi.utbrboqh.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/0e/7d/82/mzi.utbrboqh.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 19,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2010-04-05T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 357225315,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "Are You Experienced (Deluxe Version)",
      collectionCensoredName: "Are You Experienced (Deluxe Version)",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/are-you-experienced-deluxe-version/357225315?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/00/67/45/006745f5-95d5-5a06-35ed-d515e9cfd7d8/dj.tbwlxwoh.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/00/67/45/006745f5-95d5-5a06-35ed-d515e9cfd7d8/dj.tbwlxwoh.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 18,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1967-05-12T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 1603668765,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "Electric Lady Studios: A Jimi Hendrix Vision",
      collectionCensoredName: "Electric Lady Studios: A Jimi Hendrix Vision",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/electric-lady-studios-a-jimi-hendrix-vision/1603668765?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/87/f1/2c/87f12c51-97cf-6c94-91ae-f2efd3646068/886449534746.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/87/f1/2c/87f12c51-97cf-6c94-91ae-f2efd3646068/886449534746.jpg/100x100bb.jpg",
      collectionPrice: 29.99,
      collectionExplicitness: "notExplicit",
      trackCount: 39,
      copyright:
        "℗ 2024 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2024-10-04T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 357652252,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "Electric Ladyland",
      collectionCensoredName: "Electric Ladyland",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/electric-ladyland/357652252?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a6/b8/45/a6b84589-6ff7-a462-9ff9-170b724980d5/dj.wjkdwlks.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a6/b8/45/a6b84589-6ff7-a462-9ff9-170b724980d5/dj.wjkdwlks.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 17,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1968-10-16T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 970227424,
      collectionId: 970227274,
      amgArtistId: 2013812,
      artistName: "Curtis Knight & The Squires",
      collectionName: "You Can't Use My Name (feat. Jimi Hendrix)",
      collectionCensoredName: "You Can't Use My Name (feat. Jimi Hendrix)",
      artistViewUrl:
        "https://music.apple.com/us/artist/curtis-knight-the-squires/970227424?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/you-cant-use-my-name-feat-jimi-hendrix/970227274?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/4d/f1/bd/4df1bd22-9c6e-5dd6-8e8a-e3cd35d5abd7/886445090383.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/4d/f1/bd/4df1bd22-9c6e-5dd6-8e8a-e3cd35d5abd7/886445090383.jpg/100x100bb.jpg",
      collectionPrice: -1,
      collectionExplicitness: "notExplicit",
      trackCount: 14,
      copyright:
        "℗ 2015 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2015-03-24T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 1706215444,
      artistName: "The Jimi Hendrix Experience",
      collectionName:
        "Jimi Hendrix Experience: Live At The Hollywood Bowl: August 18, 1967",
      collectionCensoredName:
        "Jimi Hendrix Experience: Live At The Hollywood Bowl: August 18, 1967",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-experience-live-at-the-hollywood-bowl/1706215444?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/20/57/3c/20573cd2-2d39-4150-f475-c04c3086d27b/196871404471.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/20/57/3c/20573cd2-2d39-4150-f475-c04c3086d27b/196871404471.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 10,
      copyright:
        "℗ 2023 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2023-11-10T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 357222341,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "Axis: Bold As Love",
      collectionCensoredName: "Axis: Bold As Love",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/axis-bold-as-love/357222341?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/93/5d/c5/935dc5d5-a985-333d-0825-879ddb36e461/884977526585.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/93/5d/c5/935dc5d5-a985-333d-0825-879ddb36e461/884977526585.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 14,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1967-12-01T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 344594129,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "Blues",
      collectionCensoredName: "Blues",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/blues/344594129?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/42/46/64/mzi.iizkzlsy.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/42/46/64/mzi.iizkzlsy.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 11,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1994-04-26T07:00:00Z",
      primaryGenreName: "Blues",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 593098686,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "People, Hell and Angels",
      collectionCensoredName: "People, Hell and Angels",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/people-hell-and-angels/593098686?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/98/19/b4/9819b4a0-26e9-10c4-2aa8-2387aad5b291/886443818682.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/98/19/b4/9819b4a0-26e9-10c4-2aa8-2387aad5b291/886443818682.jpg/100x100bb.jpg",
      collectionPrice: 10.99,
      collectionExplicitness: "notExplicit",
      trackCount: 12,
      copyright:
        "℗ 2012 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2013-03-05T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 52802,
      collectionId: 255357334,
      amgArtistId: 74579,
      artistName: "Gil Evans",
      collectionName: "Plays the Music of Jimi Hendrix (Remastered)",
      collectionCensoredName: "Plays the Music of Jimi Hendrix (Remastered)",
      artistViewUrl: "https://music.apple.com/us/artist/gil-evans/52802?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/plays-the-music-of-jimi-hendrix-remastered/255357334?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music69/v4/74/45/5b/74455b3e-ce49-4c08-c08b-3b8d857714fe/dj.upjapmcb.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music69/v4/74/45/5b/74455b3e-ce49-4c08-c08b-3b8d857714fe/dj.upjapmcb.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 12,
      copyright: "℗ 2001 BMG Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1997-03-06T08:00:00Z",
      primaryGenreName: "Jazz",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 457583661,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "Hendrix In the West (Live)",
      collectionCensoredName: "Hendrix In the West (Live)",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/hendrix-in-the-west-live/457583661?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/af/6e/62/af6e62f0-c3b7-70e6-77d8-08e061bf0bb8/dj.lyfgevaj.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/af/6e/62/af6e62f0-c3b7-70e6-77d8-08e061bf0bb8/dj.lyfgevaj.jpg/100x100bb.jpg",
      collectionPrice: 10.99,
      collectionExplicitness: "notExplicit",
      trackCount: 11,
      copyright:
        "℗ 2011 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2011-09-09T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 2796003,
      collectionId: 299347665,
      amgArtistId: 6208,
      artistName: "Hiram Bullock",
      collectionName:
        "Hiram Bullock Plays the Music of Jimi Hendrix (With WDR Bigband)",
      collectionCensoredName:
        "Hiram Bullock Plays the Music of Jimi Hendrix (With WDR Bigband)",
      artistViewUrl:
        "https://music.apple.com/us/artist/hiram-bullock/2796003?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/hiram-bullock-plays-the-music-of-jimi-hendrix/299347665?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Features/e3/a7/2d/dj.eupbbddd.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Features/e3/a7/2d/dj.eupbbddd.jpg/100x100bb.jpg",
      collectionPrice: 5.99,
      collectionExplicitness: "notExplicit",
      trackCount: 7,
      copyright: "℗ 2009 BHM",
      country: "USA",
      currency: "USD",
      releaseDate: "2009-01-23T08:00:00Z",
      primaryGenreName: "Jazz",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 23583800,
      collectionId: 309848954,
      amgArtistId: 178646,
      artistName: "Nguyên Lê",
      collectionName:
        "Purple - Celebrating Jimi Hendrix (with Terri Lyne Carrington)",
      collectionCensoredName:
        "Purple - Celebrating Jimi Hendrix (with Terri Lyne Carrington)",
      artistViewUrl:
        "https://music.apple.com/us/artist/nguy%C3%AAn-l%C3%AA/23583800?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/purple-celebrating-jimi-hendrix-with-terri-lyne/309848954?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/79/52/07/795207c9-d749-2430-79d9-bea146eca314/cover.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/79/52/07/795207c9-d749-2430-79d9-bea146eca314/cover.jpg/100x100bb.jpg",
      collectionPrice: 9.9,
      collectionExplicitness: "notExplicit",
      trackCount: 10,
      copyright: "℗ 2002 ACT Music + Vision",
      country: "USA",
      currency: "USD",
      releaseDate: "2002-09-30T07:00:00Z",
      primaryGenreName: "Jazz",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 401864389,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "West Coast Seattle Boy - The Jimi Hendrix Anthology",
      collectionCensoredName:
        "West Coast Seattle Boy - The Jimi Hendrix Anthology",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/west-coast-seattle-boy-the-jimi-hendrix-anthology/401864389?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/f8/20/2a/f8202aa9-f0d3-8e1d-ce53-6fc1b08d4cb6/dj.vyuwhcem.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/f8/20/2a/f8202aa9-f0d3-8e1d-ce53-6fc1b08d4cb6/dj.vyuwhcem.jpg/100x100bb.jpg",
      collectionPrice: 39.99,
      collectionExplicitness: "notExplicit",
      trackCount: 59,
      copyright:
        '℗ 2010 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment"',
      country: "USA",
      currency: "USD",
      releaseDate: "2010-11-12T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 27596701,
      collectionId: 885386631,
      amgArtistId: 18165,
      artistName: "Eddie Hazel",
      collectionName:
        'A Night for Jimi Hendrix (Live at "Lingerie Club", Hollywood, 1990) [feat. Krunchy]',
      collectionCensoredName:
        'A Night for Jimi Hendrix (Live at "Lingerie Club", Hollywood, 1990) [feat. Krunchy]',
      artistViewUrl:
        "https://music.apple.com/us/artist/eddie-hazel/27596701?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/a-night-for-jimi-hendrix-live-at-lingerie-club/885386631?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/99/ce/34/99ce34bf-39bb-4fb5-e1b9-48b2a10d435c/8718858853830.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/99/ce/34/99ce34bf-39bb-4fb5-e1b9-48b2a10d435c/8718858853830.jpg/100x100bb.jpg",
      collectionPrice: 8.99,
      collectionExplicitness: "notExplicit",
      trackCount: 7,
      copyright: "℗ 2014 Funk To The Max",
      country: "USA",
      currency: "USD",
      releaseDate: "2014-05-28T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 36270,
      collectionId: 128929373,
      artistName: "Various Artists",
      collectionName:
        "The Spirit Lives On - The Music of Jimi Hendrix Revisited vol I",
      collectionCensoredName:
        "The Spirit Lives On - The Music of Jimi Hendrix Revisited vol I",
      collectionViewUrl:
        "https://music.apple.com/us/album/the-spirit-lives-on-the-music-of-jimi-hendrix-revisited-vol-i/128929373?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/cc/1e/70/mzi.piqacwps.tif/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/cc/1e/70/mzi.piqacwps.tif/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 13,
      copyright: "℗ 2004 Lion Music",
      country: "USA",
      currency: "USD",
      releaseDate: "2005-11-16T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 138567363,
      collectionId: 1291085916,
      amgArtistId: 701221,
      artistName: "Laith Al-Saadi",
      collectionName: "A 75th Birthday Tribute to Jimi Hendrix - EP",
      collectionCensoredName: "A 75th Birthday Tribute to Jimi Hendrix - EP",
      artistViewUrl:
        "https://music.apple.com/us/artist/laith-al-saadi/138567363?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/a-75th-birthday-tribute-to-jimi-hendrix-ep/1291085916?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/6e/40/5d/6e405d6e-a490-abb3-afe2-cd61077d794e/80164c6a-7a3c-461d-8ac5-345323b65b03.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/6e/40/5d/6e405d6e-a490-abb3-afe2-cd61077d794e/80164c6a-7a3c-461d-8ac5-345323b65b03.jpg/100x100bb.jpg",
      collectionPrice: 3.99,
      collectionExplicitness: "notExplicit",
      trackCount: 4,
      copyright: "℗ (2017) Laith Music Inc.",
      country: "USA",
      currency: "USD",
      releaseDate: "2017-09-28T07:00:00Z",
      primaryGenreName: "Psychedelic",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 344747934,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "Live At Woodstock",
      collectionCensoredName: "Live At Woodstock",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/live-at-woodstock/344747934?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/c2/e0/6d/c2e06da8-f46e-9809-8d8b-5e68a54426c3/mzi.xpgkygsu.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/c2/e0/6d/c2e06da8-f46e-9809-8d8b-5e68a54426c3/mzi.xpgkygsu.jpg/100x100bb.jpg",
      collectionPrice: 12.99,
      collectionExplicitness: "notExplicit",
      trackCount: 16,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1999-07-06T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 1318808449,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "Both Sides of the Sky",
      collectionCensoredName: "Both Sides of the Sky",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/both-sides-of-the-sky/1318808449?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/c1/53/bc/c153bc02-9f33-8258-486f-4add9385e092/886446874814.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/c1/53/bc/c153bc02-9f33-8258-486f-4add9385e092/886446874814.jpg/100x100bb.jpg",
      collectionPrice: 10.99,
      collectionExplicitness: "notExplicit",
      trackCount: 13,
      copyright:
        "℗ 2018 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2018-03-09T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 400553319,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "BBC Sessions",
      collectionCensoredName: "BBC Sessions",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/bbc-sessions/400553319?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/82/a3/89/82a38979-98be-2878-c608-ec45fa17a2a5/dj.gcbdyqnw.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/82/a3/89/82a38979-98be-2878-c608-ec45fa17a2a5/dj.gcbdyqnw.jpg/100x100bb.jpg",
      collectionPrice: 14.99,
      collectionExplicitness: "notExplicit",
      trackCount: 38,
      copyright:
        '℗ 2010 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment"',
      country: "USA",
      currency: "USD",
      releaseDate: "1998-06-02T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 344780222,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "Smash Hits",
      collectionCensoredName: "Smash Hits",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/smash-hits/344780222?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/8c/9f/08/8c9f081c-84d9-0619-1d92-122ebdbe430e/mzi.emmdnpjj.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/8c/9f/08/8c9f081c-84d9-0619-1d92-122ebdbe430e/mzi.emmdnpjj.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 12,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1968-04-16T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 608074618,
      collectionId: 1471650543,
      artistName: "8-Bit Arcade",
      collectionName: "The Ultimate Jimi Hendrix",
      collectionCensoredName: "The Ultimate Jimi Hendrix",
      artistViewUrl:
        "https://music.apple.com/us/artist/8-bit-arcade/608074618?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/the-ultimate-jimi-hendrix/1471650543?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/b8/84/49/b884495c-5cf7-360e-1134-a691885dc0a0/8BIT0231.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/b8/84/49/b884495c-5cf7-360e-1134-a691885dc0a0/8BIT0231.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 71,
      copyright: "℗ 2019 8-Bit Arcade",
      country: "USA",
      currency: "USD",
      releaseDate: "2019-07-04T07:00:00Z",
      primaryGenreName: "Dance",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 577792566,
      collectionId: 804111979,
      artistName: "The Fremont's Group",
      collectionName: "The Best of Jimi Hendrix (Remastered)",
      collectionCensoredName: "The Best of Jimi Hendrix (Remastered)",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-fremonts-group/577792566?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/the-best-of-jimi-hendrix-remastered/804111979?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/a3/be/a5/a3bea57a-91ab-ed18-e3c3-e03cb4fbc71f/4753314502413_cover.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/a3/be/a5/a3bea57a-91ab-ed18-e3c3-e03cb4fbc71f/4753314502413_cover.jpg/100x100bb.jpg",
      collectionPrice: 7.99,
      collectionExplicitness: "notExplicit",
      trackCount: 12,
      copyright: "℗ 2014 TTW",
      country: "USA",
      currency: "USD",
      releaseDate: "2014-02-06T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 456666256,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "Winterland (Live)",
      collectionCensoredName: "Winterland (Live)",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/winterland-live/456666256?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/0b/1d/9f/mzi.qyqatygm.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/0b/1d/9f/mzi.qyqatygm.jpg/100x100bb.jpg",
      collectionPrice: 34.99,
      collectionExplicitness: "notExplicit",
      trackCount: 37,
      copyright:
        "℗ 2011 Experience Hendrix L.L.C., under exclusive license to Sony Music             Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2011-09-09T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 344653779,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "Blue Wild Angel: Live At the Isle of Wight",
      collectionCensoredName: "Blue Wild Angel: Live At the Isle of Wight",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/blue-wild-angel-live-at-the-isle-of-wight/344653779?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/65/0c/a5/mzi.jnblwjyk.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/65/0c/a5/mzi.jnblwjyk.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 18,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2002-11-12T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 36270,
      collectionId: 128929442,
      artistName: "Various Artists",
      collectionName:
        "The Spirit Lives On - the Music of Jimi Hendrix Revisited vol II",
      collectionCensoredName:
        "The Spirit Lives On - the Music of Jimi Hendrix Revisited vol II",
      collectionViewUrl:
        "https://music.apple.com/us/album/the-spirit-lives-on-the-music-of-jimi-hendrix/128929442?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/3b/96/46/mzi.plhjmgjk.tif/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/3b/96/46/mzi.plhjmgjk.tif/100x100bb.jpg",
      collectionPrice: 9.9,
      collectionExplicitness: "notExplicit",
      trackCount: 10,
      copyright: "℗ 2004 Lion Music",
      country: "USA",
      currency: "USD",
      releaseDate: "2005-11-16T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 218352633,
      collectionId: 990744628,
      amgArtistId: 1083352,
      artistName: "Vitamin String Quartet",
      collectionName: "VSQ Performs Jimi Hendrix",
      collectionCensoredName: "VSQ Performs Jimi Hendrix",
      artistViewUrl:
        "https://music.apple.com/us/artist/vitamin-string-quartet/218352633?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/vsq-performs-jimi-hendrix/990744628?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/da/bc/d3/dabcd3fa-8edb-d949-d7bb-cbd2e5337659/dj.rdegqdmk.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/da/bc/d3/dabcd3fa-8edb-d949-d7bb-cbd2e5337659/dj.rdegqdmk.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 12,
      copyright: "℗ 2003 Vitamin Records",
      country: "USA",
      currency: "USD",
      releaseDate: "2003-11-04T08:00:00Z",
      primaryGenreName: "Classical Crossover",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 1480613834,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName:
        "Songs For Groovy Children: The Fillmore East Concerts (Live)",
      collectionCensoredName:
        "Songs For Groovy Children: The Fillmore East Concerts (Live)",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/songs-for-groovy-children-the-fillmore-east-concerts-live/1480613834?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/73/ed/94/73ed94dd-3e22-e2d6-ff48-15a294dd783a/886447986301.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/73/ed/94/73ed94dd-3e22-e2d6-ff48-15a294dd783a/886447986301.jpg/100x100bb.jpg",
      collectionPrice: 29.99,
      collectionExplicitness: "notExplicit",
      trackCount: 43,
      copyright:
        "℗ 2019 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2019-11-29T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 344435106,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "Live At Monterey",
      collectionCensoredName: "Live At Monterey",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/live-at-monterey/344435106?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a8/50/93/a85093ff-7053-7a02-47fe-1b3d276a850c/mzi.rrcmnhzn.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a8/50/93/a85093ff-7053-7a02-47fe-1b3d276a850c/mzi.rrcmnhzn.jpg/100x100bb.jpg",
      collectionPrice: 7.99,
      collectionExplicitness: "notExplicit",
      trackCount: 10,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2007-10-16T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 970227424,
      collectionId: 1698616968,
      amgArtistId: 2013812,
      artistName: "Curtis Knight & The Squires",
      collectionName:
        "Live at George's Club 20 (1965 & 1966) [feat. Jimi Hendrix]",
      collectionCensoredName:
        "Live at George's Club 20 (1965 & 1966) [feat. Jimi Hendrix]",
      artistViewUrl:
        "https://music.apple.com/us/artist/curtis-knight-the-squires/970227424?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/live-at-georges-club-20-1965-1966-feat-jimi-hendrix/1698616968?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/3b/7c/60/3b7c60b9-e2bf-a451-6c2b-546fe2efbe51/196871332903.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/3b/7c/60/3b7c60b9-e2bf-a451-6c2b-546fe2efbe51/196871332903.jpg/100x100bb.jpg",
      collectionPrice: 13.99,
      collectionExplicitness: "notExplicit",
      trackCount: 17,
      copyright:
        "℗ 2017 Experience Hendrix, L.L.C., under exclusive license to Sony Music",
      country: "USA",
      currency: "USD",
      releaseDate: "2017-04-21T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 344780368,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "South Saturn Delta",
      collectionCensoredName: "South Saturn Delta",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/south-saturn-delta/344780368?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/b1/50/eb/b150ebc6-a34e-ba02-612b-6288b4a67106/884977421194.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/b1/50/eb/b150ebc6-a34e-ba02-612b-6288b4a67106/884977421194.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 15,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1997-10-07T00:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 577792566,
      collectionId: 577792501,
      artistName: "The Fremont's Group",
      collectionName: "The Best of Jimi Hendrix",
      collectionCensoredName: "The Best of Jimi Hendrix",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-fremonts-group/577792566?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/the-best-of-jimi-hendrix/577792501?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/88/39/3c/88393c2c-1129-77da-9d52-edff08a84bdf/AUCD5024.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/88/39/3c/88393c2c-1129-77da-9d52-edff08a84bdf/AUCD5024.jpg/100x100bb.jpg",
      collectionPrice: 8.99,
      collectionExplicitness: "notExplicit",
      trackCount: 12,
      copyright: "℗ 2012 Start Entertainments Limited",
      country: "USA",
      currency: "USD",
      releaseDate: "2012-10-01T07:00:00Z",
      primaryGenreName: "Vocal",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 218606538,
      collectionId: 1001351458,
      artistName: "Pickin' On Series",
      collectionName: "Pickin' On Jimi Hendrix: A Bluegrass Tribute",
      collectionCensoredName: "Pickin' On Jimi Hendrix: A Bluegrass Tribute",
      artistViewUrl:
        "https://music.apple.com/us/artist/pickin-on-series/218606538?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/pickin-on-jimi-hendrix-a-bluegrass-tribute/1001351458?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/f5/2d/67/f52d6747-8d1e-b58a-2305-18668d5cbf23/8031_300dpi.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/f5/2d/67/f52d6747-8d1e-b58a-2305-18668d5cbf23/8031_300dpi.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 14,
      copyright: "℗ 1999 CMH Records",
      country: "USA",
      currency: "USD",
      releaseDate: "1999-02-16T08:00:00Z",
      primaryGenreName: "Blues-Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 129812177,
      collectionId: 297773398,
      artistName: "Ole Staveteig",
      collectionName: "Plays Jimi Hendrix",
      collectionCensoredName: "Plays Jimi Hendrix",
      artistViewUrl:
        "https://music.apple.com/us/artist/ole-staveteig/129812177?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/plays-jimi-hendrix/297773398?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/fe/e9/bb/mzi.ckugtedc.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/fe/e9/bb/mzi.ckugtedc.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 12,
      copyright: "℗ 2003 C+C Records",
      country: "USA",
      currency: "USD",
      releaseDate: "2004-03-05T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 910601361,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "The Cry of Love",
      collectionCensoredName: "The Cry of Love",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/the-cry-of-love/910601361?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b0/90/17/b09017b9-1924-cd06-52b9-fed7e8dc8e96/886444746908.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b0/90/17/b09017b9-1924-cd06-52b9-fed7e8dc8e96/886444746908.jpg/100x100bb.jpg",
      collectionPrice: 8.99,
      collectionExplicitness: "notExplicit",
      trackCount: 10,
      copyright:
        "℗ 1971 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1971-03-05T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 1024776102,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "Freedom: Atlanta Pop Festival (Live)",
      collectionCensoredName: "Freedom: Atlanta Pop Festival (Live)",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/freedom-atlanta-pop-festival-live/1024776102?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music7/v4/c5/df/88/c5df882c-f0f1-4044-6009-1efcef1f59ed/886445187939.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music7/v4/c5/df/88/c5df882c-f0f1-4044-6009-1efcef1f59ed/886445187939.jpg/100x100bb.jpg",
      collectionPrice: 12.99,
      collectionExplicitness: "notExplicit",
      trackCount: 16,
      copyright:
        "℗ 2015 Experience Hendrix, L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2015-08-28T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 344779456,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "Live At Berkeley (2nd Show)",
      collectionCensoredName: "Live At Berkeley (2nd Show)",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/live-at-berkeley-2nd-show/344779456?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/7b/f6/bc/mzi.gnkjztas.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/7b/f6/bc/mzi.gnkjztas.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 12,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2003-09-16T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 357650796,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "First Rays of the New Rising Sun",
      collectionCensoredName: "First Rays of the New Rising Sun",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/first-rays-of-the-new-rising-sun/357650796?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/6f/82/2c/6f822c83-4a7c-d8e3-7c28-1905cfce8b49/dj.qomqmufk.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/6f/82/2c/6f822c83-4a7c-d8e3-7c28-1905cfce8b49/dj.qomqmufk.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 18,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "1997-04-22T00:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 1504524548,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "Band of Gypsys (50th Anniversary / Live)",
      collectionCensoredName: "Band of Gypsys (50th Anniversary / Live)",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/band-of-gypsys-50th-anniversary-live/1504524548?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/a1/32/02/a13202b9-ecbc-ca2f-9d4f-117f6b8f32a3/20UMGIM09664.rgb.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/a1/32/02/a13202b9-ecbc-ca2f-9d4f-117f6b8f32a3/20UMGIM09664.rgb.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 6,
      copyright:
        "A Capitol Records release; ℗ 2020 Experience Hendrix L.L.C., Under exclusive license to UMG Recordings, Inc.",
      country: "USA",
      currency: "USD",
      releaseDate: "1970-03-25T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 696991650,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "Miami Pop Festival (Live)",
      collectionCensoredName: "Miami Pop Festival (Live)",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/miami-pop-festival-live/696991650?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/a4/28/d9/a428d915-1ce9-cb9e-3ce4-5ebdf3a56598/886444158305.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/a4/28/d9/a428d915-1ce9-cb9e-3ce4-5ebdf3a56598/886444158305.jpg/100x100bb.jpg",
      collectionPrice: 10.99,
      collectionExplicitness: "notExplicit",
      trackCount: 11,
      copyright:
        "℗ 2013 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2013-11-05T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 488933,
      collectionId: 1532116274,
      amgArtistId: 198268,
      artistName: "Steve Miller Band",
      collectionName:
        "Peppa Sauce (Tribute to Jimi Hendrix, Pepperland, Sept. 18, 1970) [Live] - Single",
      collectionCensoredName:
        "Peppa Sauce (Tribute to Jimi Hendrix, Pepperland, Sept. 18, 1970) [Live] - Single",
      artistViewUrl:
        "https://music.apple.com/us/artist/steve-miller-band/488933?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/peppa-sauce-tribute-to-jimi-hendrix-pepperland-sept/1532116274?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4a/7a/04/4a7a04e9-d3e1-99ba-3d30-a900f083308e/20UMGIM80357.rgb.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/4a/7a/04/4a7a04e9-d3e1-99ba-3d30-a900f083308e/20UMGIM80357.rgb.jpg/100x100bb.jpg",
      collectionPrice: 1.29,
      collectionExplicitness: "notExplicit",
      trackCount: 1,
      copyright:
        "℗ 2020 Sailor Records under exclusive license to Capitol Records, Inc",
      country: "USA",
      currency: "USD",
      releaseDate: "2020-09-18T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62852,
      collectionId: 354988143,
      amgArtistId: 85934,
      artistName: "Jimi Hendrix",
      collectionName: "Valleys of Neptune",
      collectionCensoredName: "Valleys of Neptune",
      artistViewUrl:
        "https://music.apple.com/us/artist/jimi-hendrix/62852?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/valleys-of-neptune/354988143?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/94/e8/20/mzi.xcikwuvh.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/94/e8/20/mzi.xcikwuvh.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 12,
      copyright:
        "℗ 2009 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2010-03-05T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 970227424,
      collectionId: 1705286583,
      amgArtistId: 2013812,
      artistName: "Curtis Knight & The Squires",
      collectionName:
        "No Business: The PPX Sessions Volume 2 (feat. Jimi Hendrix)",
      collectionCensoredName:
        "No Business: The PPX Sessions Volume 2 (feat. Jimi Hendrix)",
      artistViewUrl:
        "https://music.apple.com/us/artist/curtis-knight-the-squires/970227424?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/no-business-the-ppx-sessions-volume-2-feat-jimi-hendrix/1705286583?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/1f/3c/a9/1f3ca9b7-272c-78ac-7cb1-e203c37e5870/196871425483.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/1f/3c/a9/1f3ca9b7-272c-78ac-7cb1-e203c37e5870/196871425483.jpg/100x100bb.jpg",
      collectionPrice: 13.99,
      collectionExplicitness: "notExplicit",
      trackCount: 19,
      copyright:
        "℗ 2020 Experience Hendrix L.L.C., under exclusive license to Sony Music Entertainment Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2020-10-23T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 62819,
      collectionId: 1530410291,
      artistName: "The Jimi Hendrix Experience",
      collectionName: "Live In Maui",
      collectionCensoredName: "Live In Maui",
      artistViewUrl:
        "https://music.apple.com/us/artist/the-jimi-hendrix-experience/62819?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/live-in-maui/1530410291?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e1/48/e2/e148e2d5-e03f-8bde-1e4f-4b536ee15c16/886448710899.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e1/48/e2/e148e2d5-e03f-8bde-1e4f-4b536ee15c16/886448710899.jpg/100x100bb.jpg",
      collectionPrice: 14.99,
      collectionExplicitness: "notExplicit",
      trackCount: 20,
      copyright:
        "℗ 2020 Experience Hendrix, L.L.C., under exclusive license to Sony Music Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2020-11-20T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 449019873,
      collectionId: 941363853,
      amgArtistId: 2793218,
      artistName: "Davide Pannozzo",
      collectionName: "A Portrait of Jimi Hendrix",
      collectionCensoredName: "A Portrait of Jimi Hendrix",
      artistViewUrl:
        "https://music.apple.com/us/artist/davide-pannozzo/449019873?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/a-portrait-of-jimi-hendrix/941363853?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a3/5a/eb/a35aeb62-1862-8354-6272-5f5c427054a0/HEW4A.png/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a3/5a/eb/a35aeb62-1862-8354-6272-5f5c427054a0/HEW4A.png/100x100bb.jpg",
      collectionPrice: 10.99,
      collectionExplicitness: "notExplicit",
      trackCount: 8,
      copyright: "℗ 2014 Davide Pannozzo",
      country: "USA",
      currency: "USD",
      releaseDate: "2014-11-27T08:00:00Z",
      primaryGenreName: "Blues",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 4035426,
      collectionId: 129555913,
      artistName: "Various Artists",
      collectionName: "Play the Music of Jimi Hendrix",
      collectionCensoredName: "Play the Music of Jimi Hendrix",
      collectionViewUrl:
        "https://music.apple.com/us/album/play-the-music-of-jimi-hendrix/129555913?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/31/4c/35/314c35d7-735f-06fc-2092-41dcc13a85c8/750447213425.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/31/4c/35/314c35d7-735f-06fc-2092-41dcc13a85c8/750447213425.jpg/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 9,
      copyright:
        "℗ 2005 intuition, a division of SCHOTT MUSIC & MEDIA, Mainz, Germany",
      country: "USA",
      currency: "USD",
      releaseDate: "2006-01-31T08:00:00Z",
      primaryGenreName: "Jazz",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1787303613,
      collectionId: 1816129103,
      artistName: "LVwest",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl: "https://music.apple.com/us/artist/lvwest/1787303613?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1816129103?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/e5/00/14/e50014a9-d4e6-1c28-ec2a-587b92aba7eb/artwork.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/e5/00/14/e50014a9-d4e6-1c28-ec2a-587b92aba7eb/artwork.jpg/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "explicit",
      contentAdvisoryRating: "Explicit",
      trackCount: 1,
      copyright: "℗ 2025 BIG MIFF MUSIC ™",
      country: "USA",
      currency: "USD",
      releaseDate: "2025-05-23T07:00:00Z",
      primaryGenreName: "Hip-Hop/Rap",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1207977894,
      collectionId: 1490851951,
      artistName: "FO&O",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl: "https://music.apple.com/us/artist/fo-o/1207977894?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1490851951?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/b8/81/6f/b8816ff7-7170-13e8-93ad-ed8fa9094f0d/886445648836.png/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/b8/81/6f/b8816ff7-7170-13e8-93ad-ed8fa9094f0d/886445648836.png/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "notExplicit",
      trackCount: 1,
      copyright: "℗ 2015 Artist House/Record Company TEN",
      country: "USA",
      currency: "USD",
      releaseDate: "2015-04-12T07:00:00Z",
      primaryGenreName: "Pop",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1732567215,
      collectionId: 1778335840,
      artistName: "Lassic",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl: "https://music.apple.com/us/artist/lassic/1732567215?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1778335840?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ee/9f/06/ee9f06a6-bd1f-6652-0447-3068f2f41de8/810129987157.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ee/9f/06/ee9f06a6-bd1f-6652-0447-3068f2f41de8/810129987157.jpg/100x100bb.jpg",
      collectionPrice: 1.29,
      collectionExplicitness: "explicit",
      contentAdvisoryRating: "Explicit",
      trackCount: 1,
      copyright: "℗ 2024 10K Projects",
      country: "USA",
      currency: "USD",
      releaseDate: "2024-11-08T08:00:00Z",
      primaryGenreName: "Hip-Hop/Rap",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1766397626,
      collectionId: 1784060412,
      artistName: "Wyatt",
      collectionName: "Jimi hendrix - Single",
      collectionCensoredName: "Jimi hendrix - Single",
      artistViewUrl: "https://music.apple.com/us/artist/wyatt/1766397626?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1784060412?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fb/36/32/fb363298-bd73-3253-3e98-b2292e865d01/artwork.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fb/36/32/fb363298-bd73-3253-3e98-b2292e865d01/artwork.jpg/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "notExplicit",
      trackCount: 1,
      copyright: "℗ 2024 Shed productions",
      country: "USA",
      currency: "USD",
      releaseDate: "2024-12-04T08:00:00Z",
      primaryGenreName: "Hip-Hop/Rap",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1280669228,
      collectionId: 1447832780,
      artistName: "Mooder 3ks",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl:
        "https://music.apple.com/us/artist/mooder-3ks/1280669228?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1447832780?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/4f/c2/0f/4fc20f6e-eef4-cde3-507c-151ded3edf05/artwork.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/4f/c2/0f/4fc20f6e-eef4-cde3-507c-151ded3edf05/artwork.jpg/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "explicit",
      contentAdvisoryRating: "Explicit",
      trackCount: 1,
      copyright: "℗ 2018 Young Niggas Been In Charge",
      country: "USA",
      currency: "USD",
      releaseDate: "2018-06-02T07:00:00Z",
      primaryGenreName: "Hip-Hop/Rap",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 261005438,
      collectionId: 261005432,
      amgArtistId: 1129878,
      artistName: "Only Cowboys Stay In Tune",
      collectionName: "The Music of Jimi Hendrix",
      collectionCensoredName: "The Music of Jimi Hendrix",
      artistViewUrl:
        "https://music.apple.com/us/artist/only-cowboys-stay-in-tune/261005438?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/the-music-of-jimi-hendrix/261005432?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/f7/b3/d2/mzi.woxbutsx.tif/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/f7/b3/d2/mzi.woxbutsx.tif/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 6,
      copyright: "℗ 2007 Bossa Nova Music",
      country: "USA",
      currency: "USD",
      releaseDate: "2007-07-02T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 345126739,
      collectionId: 376032995,
      amgArtistId: 2259633,
      artistName: "Rudy Kronfuss",
      collectionName: "Rudy Kronfuss plays Jimi Hendrix Vol.2",
      collectionCensoredName: "Rudy Kronfuss plays Jimi Hendrix Vol.2",
      artistViewUrl:
        "https://music.apple.com/us/artist/rudy-kronfuss/345126739?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/rudy-kronfuss-plays-jimi-hendrix-vol-2/376032995?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/be/6d/29/mzi.wpyflqyq.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/be/6d/29/mzi.wpyflqyq.jpg/100x100bb.jpg",
      collectionPrice: 10.99,
      collectionExplicitness: "notExplicit",
      trackCount: 12,
      copyright: "℗ 2009 Rudy Kronfuss",
      country: "USA",
      currency: "USD",
      releaseDate: "2009-10-22T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1645900548,
      collectionId: 1640770509,
      artistName: "KidCorley",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl:
        "https://music.apple.com/us/artist/kidcorley/1645900548?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1640770509?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/d7/f6/95/d7f695e6-9206-42b1-c26e-4b1ba468cc64/artwork.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/d7/f6/95/d7f695e6-9206-42b1-c26e-4b1ba468cc64/artwork.jpg/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "notExplicit",
      trackCount: 1,
      copyright: "℗ 2022 CHD Productions",
      country: "USA",
      currency: "USD",
      releaseDate: "2022-09-09T07:00:00Z",
      primaryGenreName: "Hip-Hop/Rap",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 306407460,
      collectionId: 1480810941,
      artistName: "Materna",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl: "https://music.apple.com/us/artist/materna/306407460?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1480810941?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/6e/be/29/6ebe2951-a3a4-508f-6251-155ebd89ef32/artwork.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/6e/be/29/6ebe2951-a3a4-508f-6251-155ebd89ef32/artwork.jpg/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "explicit",
      contentAdvisoryRating: "Explicit",
      trackCount: 1,
      copyright: "℗ 2019 MAVO Music",
      country: "USA",
      currency: "USD",
      releaseDate: "2019-09-20T07:00:00Z",
      primaryGenreName: "Hip-Hop/Rap",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1597495032,
      collectionId: 1597777357,
      artistName: "Ghost Dance",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl:
        "https://music.apple.com/us/artist/ghost-dance/1597495032?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1597777357?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/5b/c0/92/5bc09236-dda7-99e0-eb6f-ca0d06e435fe/artwork.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/5b/c0/92/5bc09236-dda7-99e0-eb6f-ca0d06e435fe/artwork.jpg/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "notExplicit",
      trackCount: 1,
      copyright: "℗ 2021 3488736 Records DK",
      country: "USA",
      currency: "USD",
      releaseDate: "2021-11-26T08:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1448570048,
      collectionId: 1467828612,
      artistName: "Dellawben",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl:
        "https://music.apple.com/us/artist/dellawben/1448570048?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1467828612?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/62/03/94/62039451-7c4e-7e26-0342-e154646afe73/artwork.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/62/03/94/62039451-7c4e-7e26-0342-e154646afe73/artwork.jpg/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "notExplicit",
      trackCount: 1,
      copyright: "℗ 2019 Life Aint Cheap / Team No Sleep",
      country: "USA",
      currency: "USD",
      releaseDate: "2014-10-14T07:00:00Z",
      primaryGenreName: "Hip-Hop/Rap",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1530073728,
      collectionId: 1530127588,
      artistName: "BaByZaEe",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl:
        "https://music.apple.com/us/artist/babyzaee/1530073728?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1530127588?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b2/23/a9/b223a9ee-5404-5c38-09fe-6c24acb2fa94/artwork.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b2/23/a9/b223a9ee-5404-5c38-09fe-6c24acb2fa94/artwork.jpg/100x100bb.jpg",
      collectionPrice: 0.69,
      collectionExplicitness: "explicit",
      contentAdvisoryRating: "Explicit",
      trackCount: 1,
      copyright: "℗ 2020 BaByZaEe",
      country: "USA",
      currency: "USD",
      releaseDate: "2020-08-27T07:00:00Z",
      primaryGenreName: "Hip-Hop/Rap",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1629345405,
      collectionId: 1643380318,
      artistName: "LEO ROAR FISCHER",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl:
        "https://music.apple.com/us/artist/leo-roar-fischer/1629345405?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1643380318?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/d2/20/b4/d220b42a-2ca6-66b5-8080-a7d022093f86/artwork.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/d2/20/b4/d220b42a-2ca6-66b5-8080-a7d022093f86/artwork.jpg/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "notExplicit",
      trackCount: 1,
      copyright: "℗ 2022 3950413 Records DK",
      country: "USA",
      currency: "USD",
      releaseDate: "2022-09-02T07:00:00Z",
      primaryGenreName: "Punk",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1019717951,
      collectionId: 1019717950,
      artistName: "Lay Roo",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl:
        "https://music.apple.com/us/artist/lay-roo/1019717951?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1019717950?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/03/14/20/0314203c-c571-4de5-cd54-23b7693f06a3/889326301103_Cover.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/03/14/20/0314203c-c571-4de5-cd54-23b7693f06a3/889326301103_Cover.jpg/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "notExplicit",
      trackCount: 1,
      copyright: "℗ 2015 Lay Roo Entertainment",
      country: "USA",
      currency: "USD",
      releaseDate: "2015-08-03T07:00:00Z",
      primaryGenreName: "Pop",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 1486419110,
      collectionId: 1753050310,
      artistName: "Brianthomashornmusic",
      collectionName: "Jimi Hendrix - Single",
      collectionCensoredName: "Jimi Hendrix - Single",
      artistViewUrl:
        "https://music.apple.com/us/artist/brianthomashornmusic/1486419110?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/jimi-hendrix-single/1753050310?uo=4",
      artworkUrl60:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/40/59/85/4059850a-2b16-2a83-4e60-164a68566f95/859790006224_cover.jpg/60x60bb.jpg",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/40/59/85/4059850a-2b16-2a83-4e60-164a68566f95/859790006224_cover.jpg/100x100bb.jpg",
      collectionPrice: 0.99,
      collectionExplicitness: "notExplicit",
      trackCount: 1,
      copyright: "℗ 2024 Brianthomashornmusic",
      country: "USA",
      currency: "USD",
      releaseDate: "2024-06-19T07:00:00Z",
      primaryGenreName: "Rock",
    },
  ];

  return new Promise((resolve) => {
    resolve(
      results.filter((item) =>
        item.collectionName
          .toLocaleLowerCase()
          .includes(term.toLocaleLowerCase())
      )
    );
  });
}

function getAlbums(term: string): Promise<Album[]> {
  const key = term.trim().toLowerCase();
  let promise = albumPromiseCache.get(key);
  if (!promise) {
    promise = fetchAlbums(key);
    albumPromiseCache.set(key, promise);
  }
  return promise;
}

type AlbumGridProps = {
  query: string;
  onLoaded: (albums: Album[]) => void;
  onSelect: (album: Album) => void;
};

const AlbumGrid: React.FC<AlbumGridProps> = ({
  query,
  onLoaded,
  onSelect,
}: AlbumGridProps) => {
  const albums = use(getAlbums(query));
  useEffect(() => {
    onLoaded(albums);
  }, [albums, onLoaded]);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-6">
      {albums.map((item) => {
        const title = item.collectionName;
        return (
          <div
            key={item.collectionId}
            className="flex flex-col group"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(item);
              }
            }}
            aria-label={`Play ${title}`}
            style={{ cursor: "pointer" }}
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 transition-transform duration-200 ease-out group-hover:scale-[1.03] group-active:scale-97">
              <img
                src={upscaleArtwork(item.artworkUrl100)}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover m-0"
                draggable={false}
                loading="lazy"
              />
              {/* Dim overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
              {/* Play icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <IoPlay
                  size={46}
                  className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] group-active:scale-80 transition-transform"
                />
              </div>
            </div>
            <div className="mt-2 text-[11px] tracking-[0.06em] uppercase text-black/70 dark:text-white/70 leading-snug line-clamp-2">
              {title}
            </div>
          </div>
        );
      })}
    </div>
  );
};

type AlbumGridSkeletonProps = UnknownRecord;

const AlbumGridSkeleton: React.FC<
  AlbumGridSkeletonProps
> = ({}: AlbumGridSkeletonProps) => {
  return (
    <div className="grid grid-cols-4 gap-6">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="relative aspect-square bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
            <div className="absolute inset-0 animate-pulse bg-black/10 dark:bg-white/10" />
          </div>
          <div className="mt-2 h-[22px] bg-black/10 dark:bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="text-center text-red-500/80">
          {this.state.error.message || "Something went wrong"}
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
