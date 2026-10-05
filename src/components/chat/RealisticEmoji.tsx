"use client";

import React, { useState } from "react";

// Official Telegram 60fps Animated Emoji Assets (Served locally for 0ms latency, zero flickering, and genuine facial expressions)
const TELEGRAM_EMOJIS: Record<string, string> = {
  // Red Heart & Heart variants
  "❤️": "/emojis/telegram/red_heart.webp",
  "❤": "/emojis/telegram/red_heart.webp",
  "💓": "/emojis/telegram/beating_heart.webp",
  "💖": "/emojis/telegram/beating_heart.webp",
  "💕": "/emojis/telegram/beating_heart.webp",

  // Fire
  "🔥": "/emojis/telegram/fire.webp",

  // Party Popper
  "🎉": "/emojis/telegram/party_popper.webp",
  "🎊": "/emojis/telegram/party_popper.webp",

  // Thumbs & Hands
  "👍": "/emojis/telegram/thumbs_up.webp",
  "👍🏻": "/emojis/telegram/thumbs_up.webp",
  "👍🏼": "/emojis/telegram/thumbs_up.webp",
  "👍🏽": "/emojis/telegram/thumbs_up.webp",
  "👍🏾": "/emojis/telegram/thumbs_up.webp",
  "👍🏿": "/emojis/telegram/thumbs_up.webp",
  "👎": "/emojis/telegram/thumbs_down.webp",
  "👏": "/emojis/telegram/clapping_hands.webp",
  "🙏": "/emojis/telegram/folded_hands.webp",

  // Faces — Rich animated facial expressions (laughing, crying, winking, grinning, etc.)
  "😂": "/emojis/telegram/tears_of_joy.webp",
  "🤣": "/emojis/telegram/rofl.webp",
  "😀": "/emojis/telegram/grinning_face.webp",
  "😃": "/emojis/telegram/grinning_big_eyes.webp",
  "😄": "/emojis/telegram/grinning_smiling_eyes.webp",
  "😁": "/emojis/telegram/beaming_face.webp",
  "😆": "/emojis/telegram/squinting_face.webp",
  "😅": "/emojis/telegram/sweat_smile.webp",
  "🙂": "/emojis/telegram/slightly_smiling.webp",
  "😉": "/emojis/telegram/winking_face.webp",
  "😊": "/emojis/telegram/smiling_blush.webp",
  "😇": "/emojis/telegram/halo_smile.webp",
  "😍": "/emojis/telegram/smiling_hearts.webp",
  "🥰": "/emojis/telegram/smiling_hearts.webp",
  "😘": "/emojis/telegram/kissing_heart.webp",
  "😗": "/emojis/telegram/kissing_closed_eyes.webp",
  "😙": "/emojis/telegram/kissing_closed_eyes.webp",
  "😚": "/emojis/telegram/kissing_closed_eyes.webp",
  "😋": "/emojis/telegram/savoring_food.webp",
  "😛": "/emojis/telegram/tongue_face.webp",
  "😜": "/emojis/telegram/winking_tongue.webp",
  "😝": "/emojis/telegram/squinting_tongue.webp",
  "🤪": "/emojis/telegram/zany_face.webp",
  "🤨": "/emojis/telegram/raised_eyebrow.webp",
  "🧐": "/emojis/telegram/thinking_face.webp",
  "🤔": "/emojis/telegram/thinking_face.webp",
  "😐": "/emojis/telegram/neutral_face.webp",
  "😑": "/emojis/telegram/expressionless_face.webp",
  "😏": "/emojis/telegram/smirking_face.webp",
  "😒": "/emojis/telegram/pensive_face.webp",
  "😔": "/emojis/telegram/pensive_face.webp",
  "😌": "/emojis/telegram/relieved_face.webp",
  "😴": "/emojis/telegram/sleeping_face.webp",
  "🤤": "/emojis/telegram/drooling_face.webp",
  "🥱": "/emojis/telegram/yawning_face.webp",
  "🤫": "/emojis/telegram/shushing_face.webp",
  "😎": "/emojis/telegram/sunglasses.webp",
  "🥳": "/emojis/telegram/partying_face.webp",
  "🤩": "/emojis/telegram/star_struck.webp",
  "🥺": "/emojis/telegram/pleading_face.webp",
  "🤗": "/emojis/telegram/hugging_face.webp",
  "🤓": "/emojis/telegram/nerd_face.webp",
  "😮": "/emojis/telegram/open_mouth.webp",
  "😲": "/emojis/telegram/open_mouth.webp",
  "😳": "/emojis/telegram/flushed_face.webp",
  "🤯": "/emojis/telegram/exploding_head.webp",
  "😱": "/emojis/telegram/screaming_fear.webp",
  "😢": "/emojis/telegram/crying_face.webp",
  "😭": "/emojis/telegram/loudly_crying.webp",

  // Energy & Extra
  "🚀": "/emojis/telegram/rocket.webp",
  "💯": "/emojis/telegram/hundred_points.webp",
  "✨": "/emojis/telegram/sparkles.webp",
  "⭐": "/emojis/telegram/star.webp",
  "🌟": "/emojis/telegram/star.webp",
  "✈️": "/emojis/telegram/airplane.webp",
  "✈": "/emojis/telegram/airplane.webp",
  "🏖️": "/emojis/telegram/beach.webp",
  "🏖": "/emojis/telegram/beach.webp",
  "🍕": "/emojis/telegram/pizza.webp",
};

interface RealisticEmojiProps {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  animate?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export const RealisticEmoji: React.FC<RealisticEmojiProps> = ({
  emoji,
  size = "md",
  className = "",
  animate = true,
  onClick,
  title,
}) => {
  const [isPopping, setIsPopping] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cleanEmoji = emoji ? emoji.trim() : "";
  const assetUrl = cleanEmoji ? TELEGRAM_EMOJIS[cleanEmoji] : undefined;

  let pxSize = 28;
  if (typeof size === "number") {
    pxSize = size;
  } else {
    switch (size) {
      case "sm":
        pxSize = 20;
        break;
      case "md":
        pxSize = 28;
        break;
      case "lg":
        pxSize = 64;
        break;
      case "xl":
        pxSize = 92;
        break;
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 400);
    if (onClick) onClick(e);
  };

  // Telegram character faces: perfectly centered, stable in idle so their internal 60fps expressions shine
  const animationClass = isPopping
    ? "animate-telegram-pop"
    : animate
    ? "animate-telegram-float"
    : "";

  return (
    <span
      onClick={handleClick}
      title={title || cleanEmoji}
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 ${animationClass} ${className}`}
      style={{
        width: pxSize,
        height: pxSize,
        display: "inline-flex",
        verticalAlign: "middle",
        isolation: "isolate",
      }}
    >
      {mounted && assetUrl && !imgError ? (
        <img
          src={assetUrl}
          alt={cleanEmoji}
          width={pxSize}
          height={pxSize}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain pointer-events-none select-none transition-opacity duration-200"
          style={{
            imageRendering: "auto",
            filter: "none",
            mixBlendMode: "normal",
          }}
        />
      ) : (
        <span
          className="text-center select-none font-emoji"
          style={{
            fontSize: `${pxSize * 0.85}px`,
            lineHeight: 1,
            color: "initial",
            filter: "none",
          }}
        >
          {cleanEmoji}
        </span>
      )}
    </span>
  );
};

