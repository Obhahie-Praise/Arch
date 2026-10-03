import Image, { type ImageProps } from "next/image";

type ThemeImageProps = Omit<ImageProps, "src" | "priority" | "loading"> & {
  srcLight: string;
  srcDark: string;
  priority?: boolean;
};

export const ThemeImage = (props: ThemeImageProps) => {
  const { srcLight, srcDark, alt, className = "", ...rest } = props;

  return (
    <>
      <Image
        {...rest}
        src={srcLight}
        alt={alt}
        className={`dark:hidden ${className}`}
      />
      <Image
        {...rest}
        src={srcDark}
        alt={alt}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
};
