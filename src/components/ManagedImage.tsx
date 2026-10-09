import { useState, type ComponentProps } from "react";
import { useManagedAsset } from "@/lib/media-management";
import { useSiteLanguage } from "@/lib/site-language";

/** One source can be replaced everywhere or in a particular display context. */
export function ManagedImage({
  mediaContext,
  src,
  alt,
  style,
  onError,
  ...props
}: ComponentProps<"img"> & { mediaContext: string }) {
  const resolved = useManagedAsset(src, mediaContext);
  const { language } = useSiteLanguage();
  const [failed, setFailed] = useState<string | null>(null);
  const replacement = resolved?.asset.url;
  const url = resolved?.override && replacement && failed !== replacement ? replacement : src;
  const override = resolved?.override;
  const label = override && (language === "ar" ? override.title_ar : override.title_en);
  return (
    <img
      {...props}
      src={url}
      alt={alt === "" ? "" : label || alt}
      data-media-context={mediaContext}
      data-media-id={resolved?.asset.id}
      data-media-origin={resolved?.asset.origin ?? props["data-media-origin" as keyof typeof props]}
      style={{
        ...style,
        ...(override
          ? { objectFit: override.fit, objectPosition: `${override.focal_x}% ${override.focal_y}%` }
          : {}),
      }}
      onError={(event) => {
        if (replacement && replacement !== src && failed !== replacement) setFailed(replacement);
        else onError?.(event);
      }}
    />
  );
}
